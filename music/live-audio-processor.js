class TouchMusicLiveProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.capacity = Math.floor(sampleRate * 8);
    this.buffers = [
      new Float32Array(this.capacity),
      new Float32Array(this.capacity),
    ];
    this.writeIndex = 0;
    this.readPosition = 0;
    this.buffered = 0;
    this.delaySamples = Math.floor(sampleRate * 0.35);
    this.targetRate = 1;
    this.currentRate = 1;

    this.jumpPosition = 0;
    this.jumpRemaining = 0;
    this.jumpLength = Math.floor(sampleRate * 0.045);

    this.frozen = false;
    this.grainStart = 0;
    this.grainPhase = 0;
    this.grainLength = Math.floor(sampleRate * 0.16);
    this.pulseRemaining = 0;

    this.echoMix = 0;
    this.echoSamples = Math.floor(sampleRate * 0.5);

    this.port.onmessage = ({ data }) => {
      if (data.type === "rate") {
        this.targetRate = Math.max(0.78, Math.min(1.28, data.value));
      }
      if (data.type === "offset") {
        this.delaySamples = Math.floor(
          sampleRate * Math.max(0.12, Math.min(7.5, data.seconds)),
        );
        this.beginJump(
          (this.writeIndex - this.delaySamples + this.capacity) % this.capacity,
        );
      }
      if (data.type === "freeze") {
        if (data.enabled) {
          this.frozen = true;
          this.grainStart = this.readPosition;
          this.grainPhase = 0;
          this.grainLength = Math.floor(
            sampleRate * Math.max(0.08, Math.min(0.34, data.grainSeconds || 0.16)),
          );
        } else {
          this.frozen = false;
          this.pulseRemaining = 0;
          this.beginJump(
            (this.writeIndex - this.delaySamples + this.capacity) % this.capacity,
          );
        }
      }
      if (data.type === "pulse") {
        const grainSeconds = Math.max(
          0.07,
          Math.min(0.24, data.grainSeconds || 0.125),
        );
        const repeats = Math.max(2, Math.min(8, data.repeats || 4));
        this.grainLength = Math.floor(sampleRate * grainSeconds);
        this.grainStart = this.readPosition;
        this.grainPhase = 0;
        this.pulseRemaining = this.grainLength * repeats;
      }
      if (data.type === "echo") {
        this.echoMix = Math.max(0, Math.min(0.62, data.mix));
        this.echoSamples = Math.floor(
          sampleRate * Math.max(0.08, Math.min(2, data.seconds)),
        );
      }
    };
  }

  beginJump(position) {
    this.jumpPosition = position;
    this.jumpRemaining = this.jumpLength;
  }

  read(buffer, position) {
    const wrapped = (position + this.capacity) % this.capacity;
    const index = Math.floor(wrapped);
    const next = (index + 1) % this.capacity;
    const fraction = wrapped - index;
    return buffer[index] + (buffer[next] - buffer[index]) * fraction;
  }

  window(phase, length) {
    return 0.5 - 0.5 * Math.cos((Math.PI * 2 * phase) / length);
  }

  softClip(value) {
    const x = value * 1.08;
    return (x * (27 + x * x)) / (27 + 9 * x * x);
  }

  grain(buffer) {
    const half = Math.floor(this.grainLength / 2);
    const phaseA = this.grainPhase % this.grainLength;
    const phaseB = (this.grainPhase + half) % this.grainLength;
    const windowA = this.window(phaseA, this.grainLength);
    const windowB = this.window(phaseB, this.grainLength);
    const sampleA = this.read(buffer, this.grainStart + phaseA);
    const sampleB = this.read(buffer, this.grainStart + phaseB);
    return (sampleA * windowA + sampleB * windowB) /
      Math.max(0.5, windowA + windowB);
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    const frames = output[0]?.length ?? 128;

    for (let frame = 0; frame < frames; frame += 1) {
      for (let channel = 0; channel < this.buffers.length; channel += 1) {
        const inputChannel = input[channel] || input[0];
        this.buffers[channel][this.writeIndex] = inputChannel?.[frame] ?? 0;
      }
      this.writeIndex = (this.writeIndex + 1) % this.capacity;
      this.buffered = Math.min(this.capacity, this.buffered + 1);

      if (this.buffered <= this.delaySamples) {
        for (const outputChannel of output) outputChannel[frame] = 0;
        continue;
      }

      this.currentRate += (this.targetRate - this.currentRate) * 0.0016;
      const granular = this.frozen || this.pulseRemaining > 0;

      for (let channel = 0; channel < output.length; channel += 1) {
        const buffer = this.buffers[channel] || this.buffers[0];
        let dry;

        if (granular) {
          dry = this.grain(buffer);
        } else if (this.jumpRemaining > 0) {
          const progress = 1 - this.jumpRemaining / this.jumpLength;
          const oldGain = Math.cos(progress * Math.PI * 0.5);
          const newGain = Math.sin(progress * Math.PI * 0.5);
          dry =
            this.read(buffer, this.readPosition) * oldGain +
            this.read(buffer, this.jumpPosition) * newGain;
        } else {
          dry = this.read(buffer, this.readPosition);
        }

        const echo = this.read(
          buffer,
          this.readPosition - this.echoSamples,
        );
        const mixed =
          dry * (1 - this.echoMix * 0.28) + echo * this.echoMix * 0.54;
        output[channel][frame] = this.softClip(mixed) * 0.9;
      }

      if (granular) {
        this.grainPhase = (this.grainPhase + 1) % this.grainLength;
        if (this.pulseRemaining > 0) {
          this.pulseRemaining -= 1;
          if (this.pulseRemaining === 0 && !this.frozen) {
            this.beginJump(
              (this.writeIndex - this.delaySamples + this.capacity) %
                this.capacity,
            );
          }
        }
      } else {
        this.readPosition =
          (this.readPosition + this.currentRate) % this.capacity;
        if (this.jumpRemaining > 0) {
          this.jumpPosition =
            (this.jumpPosition + this.currentRate) % this.capacity;
          this.jumpRemaining -= 1;
          if (this.jumpRemaining === 0) {
            this.readPosition = this.jumpPosition;
          }
        }

        const distance =
          (this.writeIndex - this.readPosition + this.capacity) % this.capacity;
        if (
          this.jumpRemaining === 0 &&
          (distance < 192 || distance > this.capacity - 192)
        ) {
          this.beginJump(
            (this.writeIndex - this.delaySamples + this.capacity) %
              this.capacity,
          );
        }
      }
    }

    return true;
  }
}

registerProcessor("touch-music-live", TouchMusicLiveProcessor);
