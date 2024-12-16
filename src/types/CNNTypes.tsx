import { ActivationFunctions } from "./FCNTypes";

enum CNNLayerTypes {
  Input = "Input",
  Conv = "Conv",
  Pool = "Pool",
  Padding = "Padding",
  Flatten = "Flatten",
  Dense = "Dense",
  Dropout = "Dropout",
  Output = "Output",
}

type InputLayer = {
  size: [number, number, number];
  type: CNNLayerTypes.Input;
};

type ConvLayer = {
  size: number;
  kernel: [number, number];
  type: CNNLayerTypes.Conv;
};

type PoolLayer = {
  stride: [number, number];
  kernel: [number, number];
  type: CNNLayerTypes.Pool;
};

type PaddingLayer = {
  padding: [number, number];
  type: CNNLayerTypes.Padding;
};

type FlattenLayer = {
  type: CNNLayerTypes.Flatten;
};

type CNNDenseLayer = {
  size: number;
  activation: ActivationFunctions;
  type: CNNLayerTypes.Dense;
};

type CNNDropoutLayer = {
  rate: number;
  type: CNNLayerTypes.Dropout;
};

type CNNOutputLayer = {
  size: number;
  activation: ActivationFunctions;
  type: CNNLayerTypes.Output;
};

type CNNLayer =
  | InputLayer
  | ConvLayer
  | PoolLayer
  | PaddingLayer
  | FlattenLayer
  | CNNDenseLayer
  | CNNDropoutLayer
  | CNNOutputLayer;

const cnnEmptyLayers: Record<CNNLayerTypes, () => CNNLayer> = {
  Input: () => ({ size: [1, 1, 1], type: CNNLayerTypes.Input } as InputLayer),
  Conv: () =>
    ({ size: 1, kernel: [1, 1], type: CNNLayerTypes.Conv } as CNNLayer),
  Pool: () =>
    ({ stride: [1, 1], kernel: [1, 1], type: CNNLayerTypes.Pool } as PoolLayer),
  Padding: () =>
    ({ padding: [1, 1], type: CNNLayerTypes.Padding } as PaddingLayer),
  Flatten: () => ({ type: CNNLayerTypes.Flatten } as FlattenLayer),
  Dense: () =>
    ({
      size: 1,
      activation: ActivationFunctions.ReLU,
      type: CNNLayerTypes.Dense,
    } as CNNDenseLayer),
  Dropout: () =>
    ({ rate: 0.01, type: CNNLayerTypes.Dropout } as CNNDropoutLayer),
  Output: () =>
    ({
      size: 1,
      activation: ActivationFunctions.ReLU,
      type: CNNLayerTypes.Output,
    } as CNNOutputLayer),
} as const;

const CNN_LIMITS = {
  INPUT: {
    CHANNELS: {
      MIN: 1,
      MAX: 512,
    },
    SIZE: {
      MIN: 1,
      MAX: 2048,
    },
  },
  CONV: {
    SIZE: {
      MIN: 1,
      MAX: 2048,
    },
    KERNEL: {
      MIN: 1,
      MAX: 13,
    },
  },
  POOL: {
    STRIDE: {
      MIN: 1,
      MAX: 7,
    },
    KERNEL: {
      MIN: 1,
      MAX: 7,
    },
  },
  PADDING: {
    PAD: {
      MIN: 1,
      MAX: 12,
    },
  },
  DENSE: {
    SIZE: {
      MIN: 1,
      MAX: 2048,
    },
  },
  DROPOUT: {
    RATE: {
      MIN: 0.01,
      MAX: 1,
    },
  },
  OUTPUT: {
    SIZE: {
      MIN: 1,
      MAX: 1024,
    },
  },
};

export { CNN_LIMITS, cnnEmptyLayers, CNNLayerTypes };
export type {
  CNNDenseLayer,
  CNNDropoutLayer,
  CNNLayer,
  CNNOutputLayer,
  ConvLayer,
  FlattenLayer,
  InputLayer,
  PaddingLayer,
  PoolLayer,
};
