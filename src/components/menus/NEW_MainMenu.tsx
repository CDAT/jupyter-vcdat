// Dependencies
import React, { useRef } from "react";
import AppControl from "../../modules/AppControl";

// Components
import TopButtons from "./NEW_TopButtons";
import { Alert, Spinner, Card } from "reactstrap";

const centered: React.CSSProperties = {
  margin: "auto",
};

const sidebarOverflow: React.CSSProperties = {
  height: "calc(100vh - 52px)",
  maxHeight: "100vh",
  minWidth: "370px",
  overflow: "auto",
};

const MainMenu = (): JSX.Element => {
  const app: AppControl = AppControl.getInstance();

  return (
    <Card style={{ ...centered, ...sidebarOverflow }}>
      <TopButtons app={app} />
      {/* <VarMenu
          {...varMenuProps}
          ref={(loader): VarMenu => (this.varMenuRef = loader)}
        />
        <GraphicsMenu
          {...graphicsMenuProps}
          ref={(loader): GraphicsMenu => (this.graphicsMenuRef = loader)}
        />
        <TemplateMenu
          {...templateMenuProps}
          ref={(loader): TemplateMenu => (this.templateMenuRef = loader)}
        />
        <ExportPlotModal {...exportPlotModalProps} />
        <InputModal
          {...inputModalProps}
          ref={(loader): InputModal => (this.filePathInputRef = loader)}
      />*/}
      <div>
        <Alert color="info" isOpen={null} toggle={null}>
          {
            // `Saving ${this.state.plotName}.${this.state.plotFormat} ...`
          }
          <Spinner color="info" />
        </Alert>
        <Alert color="primary" isOpen={null} toggle={null}>
          {
            // `Exported ${this.state.plotName}.${this.state.plotFormat}`
          }
        </Alert>
      </div>
    </Card>
    /* <PopUpModal
          title="Notice"
          message="Loading CDAT core modules. Please wait..."
          btnText="OK"
          ref={(loader): PopUpModal => (this.loadingModalRef = loader)}
        />*/
  );
};

export default MainMenu;
