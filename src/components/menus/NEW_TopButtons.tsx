// Dependencies
import * as React from "react";
import { Button, Card, CardBody, Col, Row } from "reactstrap";

// Project Components
import AppControl from "../../modules/AppControl";
import NotebookUtilities from "../../modules/Utilities/NotebookUtilities";
import { usePlot, PlotAction } from "../../modules/contexts/PlotContext";
import { useModal, ModalAction } from "../../modules/contexts/ModalContext";
import { VCDAT_MODALS } from "../../VCDATWidget";

const btnStyle: React.CSSProperties = {
  width: "100%",
};
const centered: React.CSSProperties = {
  margin: "auto",
};

interface IVCSMenuProps {
  app: AppControl;
}

const TopButtons = (props: IVCSMenuProps): JSX.Element => {
  const app: AppControl = props.app;

  const [plotState, plotDispatch] = usePlot();
  const [modalState, modalDispatch] = useModal();

  const showExportModal = (): void => {
    modalDispatch(ModalAction.show(VCDAT_MODALS.ExportPlot));
  };

  const clearCanvas = (): void => {
    app.codeInjector.clearPlot();
  };

  const plot = async (): Promise<void> => {
    try {
      if (app.varTracker.selectedVariables.length === 0) {
        NotebookUtilities.showMessage(
          "Notice",
          "Please select a variable from the left panel."
        );
      } else {
        if (plotState.shouldAnimate) {
          // Inject the animation code
          await app.codeInjector.animate(
            plotState.selectedGM,
            plotState.selectedGMgroup,
            plotState.selectedTemplate,
            plotState.animationAxisIndex,
            plotState.animationRate,
            plotState.animateAxisInvert,
            plotState.selectedColormap
          );
        } else {
          // Inject the plot
          await app.codeInjector.plot(
            plotState.selectedGM,
            plotState.selectedGMgroup,
            plotState.selectedTemplate,
            plotState.overlayMode,
            plotState.previousDisplayMode,
            plotState.currentDisplayMode
          );
        }
        plotDispatch(PlotAction.setPlotExist(true));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card>
      <CardBody className={/* @tag<vcsmenu-main>*/ "vcsmenu-main-vcdat"}>
        <div style={centered}>
          <Row>
            <Col sm={plotState.shouldAnimate ? 5 : 3}>
              <Button
                className={/* @tag<vcsmenu-plot-btn>*/ "vcsmenu-plot-btn-vcdat"}
                type="button"
                color={plotState.shouldAnimate ? "warning" : "primary"}
                style={btnStyle}
                onClick={plot}
                disabled={!plotState.plotReady}
                title="Animate the selected variable over its selected axis"
              >
                {plotState.shouldAnimate ? "Animate" : "Plot"}
              </Button>
            </Col>
            <Col
              sm={plotState.shouldAnimate ? 3 : 4}
              style={{ padding: "0 5px" }}
            >
              <Button
                className={
                  /* @tag<vcsmenu-export-btn>*/ "vcsmenu-export-btn-vcdat"
                }
                type="button"
                color="primary"
                style={btnStyle}
                onClick={showExportModal}
                disabled={
                  !plotState.plotReady ||
                  !plotState.plotExists ||
                  plotState.shouldAnimate
                }
                title="Exports the current canvas plot."
              >
                Export
              </Button>
            </Col>
            <Col sm={4}>
              <Button
                className={
                  /* @tag<vcsmenu-clear-btn>*/ "vcsmenu-clear-btn-vcdat"
                }
                type="button"
                color="primary"
                style={btnStyle}
                onClick={clearCanvas}
                disabled={!plotState.plotReady}
                title="Clears the canvas."
              >
                Clear
              </Button>
            </Col>
          </Row>
        </div>
      </CardBody>
    </Card>
  );
};

export default TopButtons;
