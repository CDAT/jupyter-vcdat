// Dependencies
import * as React from "react";
import { Button, Card, CardBody } from "reactstrap";
// Project Components
import PlotMenu from "./PlotMenu";
import VarMenu from "./VarMenu";
import GraphicsMethodMenu from "./GraphicsMethodMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";

const btnStyle: React.CSSProperties = {
  margin: "5px"
};
const divStyle: React.CSSProperties = {
    "overflow": "scroll",
};

type VCSMenuProps = {
  plotAction: any; // the method to call when the user hits the "Plot" button
  updatePlotOptions: any; // a method to cause the plot options to be updated
  filePath: string; // the file path for the selected netCDF file
};
type VCSMenuState = {
  plotReady: boolean; // are we ready to plot
};

export class VCSMenu extends React.Component<VCSMenuProps, VCSMenuState> {
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      plotReady: false
    };
  }
  render() {
    let plotMenuProps = {
      updatePlotOptions: this.props.updatePlotOptions,
      varInfo: new Variable()
    };
    let VarMenuProps = {
      filePath: this.props.filePath
    };
    let GraphicsMethodMenuProps = {
        updateGraphicsMethodOptions: () => {}
    };
    let TemplateMenuProps = {
        updateTemplate: () => {}
    };

    return (
      <div>
        <VarMenu {...VarMenuProps} />
        <PlotMenu {...plotMenuProps} />
        <GraphicsMethodMenu {...GraphicsMethodMenuProps} />
        <TemplateMenu {...TemplateMenuProps} />
        <Card>
          <CardBody>
            <Button
              type="button"
              color="primary"
              style={btnStyle}
              onClick={this.props.plotAction}
              disabled={this.state.plotReady}
            >
              Plot
            </Button>
            <Button
              type="button"
              color="primary"
              style={btnStyle}
              onClick={this.props.plotAction}
              disabled={this.state.plotReady}
            >
              Save Image
            </Button>
            <Button
              type="button"
              color="primary"
              style={btnStyle}
              onClick={this.props.plotAction}
              disabled={this.state.plotReady}
            >
              Clear Plot
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }
}
