// Dependencies
import * as React from "react";
import { Button, Card, CardBody, Col, Row } from "reactstrap";

// Project Components
import AppControl from "../../modules/AppControl";

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

  return (
    <Card>
      <CardBody className={/* @tag<vcsmenu-main>*/ "vcsmenu-main-vcdat"}>
        <div style={centered}>
          <Row>
            <Col sm={app.state.shouldAnimate ? 5 : 3}>
              <Button
                className={/* @tag<vcsmenu-plot-btn>*/ "vcsmenu-plot-btn-vcdat"}
                type="button"
                color={app.state.shouldAnimate ? "warning" : "primary"}
                style={btnStyle}
                onClick={null}
                disabled={!app.state.plotReady}
                title="Animate the selected variable over its selected axis"
              >
                {app.state.shouldAnimate ? "Animate" : "Plot"}
              </Button>
            </Col>
            <Col
              sm={app.state.shouldAnimate ? 3 : 4}
              style={{ padding: "0 5px" }}
            >
              <Button
                className={
                  /* @tag<vcsmenu-export-btn>*/ "vcsmenu-export-btn-vcdat"
                }
                type="button"
                color="primary"
                style={btnStyle}
                onClick={null}
                disabled={
                  !app.state.plotReady ||
                  !app.state.plotExists ||
                  app.state.shouldAnimate
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
                onClick={null}
                disabled={!app.state.plotReady}
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
