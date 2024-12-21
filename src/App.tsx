import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, message, Splitter, Tabs, Tooltip } from "antd";
import { useState } from "react";
import CNNForm from "./components/CNNForm";
import CodeEditor from "./components/CodeEditor";
import FCNForm from "./components/FCNForm";
import { CNNLayer, sampleCNN } from "./types/CNNTypes";
import { FCNLayer, sampleFCN } from "./types/FCNTypes";
import CNNVisual from "./visuals/CNNVisual";
import FCNVisual from "./visuals/FCNVisual";

const fontFace = new FontFace(
  "JetBrainsMono",
  'url("/JetBrainsMono-Regular.ttf")'
);
fontFace.load().then((font) => {
  document.fonts.add(font);
});

enum MODEL_TYPE {
  FCN = "FCN",
  CNN = "CNN",
  XXX = "XXX",
}

function validateFCNLayers(layers: FCNLayer[]) {
  if (layers[0].type !== "Input") {
    return { success: false, content: "First layer must be an input layer" };
  }
  for (let i = 1; i < layers.length; i++) {
    if (layers[i].type === "Input") {
      return { success: false, content: "Input layer must be the first layer" };
    }
  }
  if (layers[layers.length - 1].type !== "Output") {
    return { success: false, content: "Last layer must be an output layer" };
  }
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === "Dropout") {
      if (layers[i - 1].type !== "Dense") {
        return {
          success: false,
          content: "Dropout layers must be preceded by a dense layer",
        };
      }
    }
  }
  return { success: true, content: "" };
}

function validateCNNLayers(layers: CNNLayer[]) {
  let flattenIndex = -1;
  if (layers[0].type !== "Input") {
    return { success: false, content: "First layer must be an input layer" };
  }
  if (layers[layers.length - 1].type !== "Output") {
    return { success: false, content: "Last layer must be an output layer" };
  }
  for (let i = 1; i < layers.length - 1; i++) {
    switch (layers[i].type) {
      case "Input":
        return {
          success: false,
          content: "Input layer must be the first layer",
        };
      case "Flatten":
        if (flattenIndex !== -1) {
          return {
            success: false,
            content: "Only one flatten layer is allowed",
          };
        }
        flattenIndex = i;
        break;
      case "Dropout":
        if (layers[i - 1].type !== "Dense") {
          return {
            success: false,
            content: "Dropout layers must be preceded by a dense layer",
          };
        }
        break;
      case "Dense":
        if (flattenIndex === -1) {
          return {
            success: false,
            content: "Dense layers must come after a flatten layer",
          };
        }
        break;
      case "Output":
        return {
          success: false,
          content: "Output layer must be the last layer",
        };
      case "Conv":
      case "Pool":
      case "Padding":
        if (flattenIndex !== -1) {
          return {
            success: false,
            content: `${layers[i].type} layers must come before flatten layer`,
          };
        }
        break;
      default:
        break;
    }
  }

  return { success: true, content: "" };
}

function App() {
  const [tourOpen, setTourOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MODEL_TYPE>(MODEL_TYPE.FCN);
  const [maximizeViz, setMaximizeViz] = useState(false);
  const [cnnLayersForm, setCnnLayersForm] = useState<CNNLayer[]>(sampleCNN());
  const [cnnLayers, setCnnLayers] = useState<CNNLayer[]>([]);
  const [fcnLayersForm, setFcnLayersForm] = useState<FCNLayer[]>(sampleFCN());
  const [fcnLayers, setFcnLayers] = useState<FCNLayer[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const typeRef = useRef(null),
    genRef = useRef(null),
    codeRef = useRef(null);
  const fcnRefs = {
    itemRef: useRef(null),
    configRef: useRef(null),
    dlRef: useRef(null),
  };
  const cnnRefs = {
    itemRef: useRef(null),
    configRef: useRef(null),
    dlRef: useRef(null),
  };

  const fcnSteps: TourProps["steps"] = [
    {
      title: "Model Type",
      description: "Choose the type of your model",
      target: () => typeRef.current,
    },
    {
      title: "Layers configuation",
      description: "Add and config layer type and parameters.",
      target: () => fcnRefs.itemRef.current,
    },
    {
      title: "Arrange Layers",
      description: "Move layers to rearrange or delete them.",
      target: () => fcnRefs.itemRef.current,
    },
    {
      title: "Generate",
      description: "Generate code and visualization with one click.",
      target: () => genRef.current,
    },
    {
      title: "Configure annotations",
      description: "Configure the visualization's annotation settings.",
      target: () => fcnRefs.configRef.current,
      placement: "right",
    },
    {
      title: "Download",
      description: "Download the visualization.",
      target: () => fcnRefs.dlRef.current,
    },
    {
      title: "Copy code",
      description: "Copy code or download as .py file.",
      target: () => codeRef.current,
      placement: "left",
    },
  ];

  const cnnSteps: TourProps["steps"] = [
    {
      title: "Model Type",
      description: "Choose the type of your model",
      target: () => typeRef.current,
    },
    {
      title: "Layers configuation",
      description: "Add and config layer type and parameters.",
      target: () => cnnRefs.itemRef.current,
    },
    {
      title: "Arrange Layers",
      description: "Move layers to rearrange or delete them.",
      target: () => cnnRefs.itemRef.current,
    },
    {
      title: "Generate",
      description: "Generate code and visualization with one click.",
      target: () => genRef.current,
    },
    {
      title: "Configure annotations",
      description: "Configure the visualization's annotation settings.",
      target: () => cnnRefs.configRef.current,
      placement: "right",
    },
    {
      title: "Download",
      description: "Download the visualization.",
      target: () => cnnRefs.dlRef.current,
    },
    {
      title: "Copy code",
      description: "Copy code or download as .py file.",
      target: () => codeRef.current,
      placement: "left",
    },
  ];

  const renderForm = () => {
    console.log("rendering form");
    return (
      <div className="h-full">
        <Tabs
          activeKey={activeTab}
          tabBarStyle={{
            paddingLeft: "1rem",
            backgroundColor: "white", // Set background color for the tab bar
            borderBottom: "1px solid #e5e7eb", // Light gray border
          }}
          onChange={(e) => setActiveTab(e as MODEL_TYPE)}
          items={[
            {
              key: MODEL_TYPE.FCN,
              label: (
                <span
                  ref={typeRef}
                  className={`py-2 px-4 rounded-lg ${
                    activeTab === MODEL_TYPE.FCN
                      ? "bg-slate-700 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {MODEL_TYPE.FCN}
                </span>
              ),
              children: (
                <FCNForm
                  itemRef={fcnRefs.itemRef}
                  fcnLayers={fcnLayersForm}
                  setFcnLayers={setFcnLayersForm}
                />
              ),
            },
            {
              key: MODEL_TYPE.CNN,
              label: (
                <span
                  className={`py-2 px-4 rounded-lg ${
                    activeTab === MODEL_TYPE.CNN
                      ? "bg-slate-700 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {MODEL_TYPE.CNN}
                </span>
              ),
              children: (
                <CNNForm
                  itemRef={cnnRefs.itemRef}
                  cnnLayers={cnnLayersForm}
                  setCnnLayers={setCnnLayersForm}
                />
              ),
            },
          ]}
        />
      </div>
    );
  };

  const renderVisual = () => {
    console.log("rendering visual");
    switch (activeTab) {
      case "FCN":
        return (
          <FCNVisual
            configRef={fcnRefs.configRef}
            dlRef={fcnRefs.dlRef}
            fcnLayers={fcnLayers}
            toggleMaximize={() => setMaximizeViz(!maximizeViz)}
            maximizeState={maximizeViz}
          />
        );
      case "CNN":
        return (
          <CNNVisual
            configRef={cnnRefs.configRef}
            dlRef={cnnRefs.dlRef}
            layers={cnnLayers}
            toggleMaximize={() => setMaximizeViz(!maximizeViz)}
            maximizeState={maximizeViz}
            width={window.innerWidth / 2}
            height={window.innerHeight / 1}
          />
        );
      default:
        return <div>Coming Soon</div>;
    }
  };

  const generate = () => {
    if (activeTab === MODEL_TYPE.CNN) {
      const { success, content } = validateCNNLayers(cnnLayersForm);
      if (success) {
        setCnnLayers(structuredClone(cnnLayersForm));
      } else {
        messageApi.open({
          type: "error",
          content: content,
          duration: 2,
        });
      }
    } else if (activeTab === MODEL_TYPE.FCN) {
      const { success, content } = validateFCNLayers(fcnLayersForm);
      if (success) {
        setFcnLayers(structuredClone(fcnLayersForm));
      } else {
        messageApi.open({
          type: "error",
          content: content,
          duration: 2,
        });
      }
    } else {
      console.log("Coming Soon");
    }
  };

  // useEffect(() => {
  //   generateFCNCode();
  //   generateCNNCode();
  // }, [kerasType]);

  return (
    <div className="app-container min-h-screen bg-slate-50">
      {contextHolder}
      <Tour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        steps={
          activeTab === MODEL_TYPE.CNN
            ? cnnSteps
            : activeTab === MODEL_TYPE.FCN
            ? fcnSteps
            : []
        }
        indicatorsRender={(current, total) => (
          <span>
            {current + 1} / {total}
          </span>
        )}
        type="primary"
      />
      <div className="header flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <Button
          ref={genRef}
          type="primary"
          className="bg-slate-700 hover:bg-slate-800 border-none generate-button"
          onClick={generate}
        >
          Generate
        </Button>

        <div className="right-controls">
          <Tooltip title="Help">
            <Button
              icon={<QuestionCircleOutlined />}
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              onClick={() => setTourOpen(true)}
            />
          </Tooltip>
        </div>
      </div>
      <Splitter
        style={{ height: "100vh", boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)" }}
      >
        <Splitter.Panel className={maximizeViz ? "basis-full" : ""}>
          {renderVisual()}
        </Splitter.Panel>
        <Splitter.Panel
          collapsible
          className={maximizeViz ? "ant-splitter-panel-hidden basis-0" : ""}
          // style={{ flexBasis: maximizeViz ? "0" :  }}
        >
          <Splitter layout="vertical">
            <Splitter.Panel>{renderForm()}</Splitter.Panel>
            <Splitter.Panel>
              <CodeEditor
                activeTab={activeTab}
                fcnLayers={fcnLayers}
                cnnLayers={cnnLayers}
              />
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}

export default App;
