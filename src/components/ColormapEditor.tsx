import * as React from "react";
import {
  Button,
  Card,
  CardBody,
  CardSubtitle,
  CardTitle,
  Collapse,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  InputGroup,
  InputGroupAddon,
  ListGroup,
  ListGroupItem
} from "reactstrap";

const default_colormaps = ['AMIP',
  'NCAR',
  'bl_to_darkred',
  'bl_to_drkorang',
  'blends',
  'blue2darkorange',
  'blue2darkred',
  'blue2green',
  'blue2grey',
  'blue2orange',
  'blue2orange2red',
  'blue_to_grey',
  'blue_to_grn',
  'blue_to_orange',
  'blue_to_orgred',
  'brown2blue',
  'brown_to_blue',
  'categorical',
  'classic',
  'default',
  'green2magenta',
  'grn_to_magenta',
  'inferno',
  'lightblue2darkblue',
  'ltbl_to_drkbl',
  'magma',
  'plasma',
  'rainbow',
  'rainbow_no_grn',
  'rainbownogreen',
  'sequential',
  'viridis',
  'white2blue',
  'white2green',
  'white2magenta',
  'white2red',
  'white2yellow',
  'white_to_blue',
  'white_to_green',
  'white_to_magenta',
  'white_to_red',
  'white_to_yellow'];

const dropdownMenuStyle: React.CSSProperties = {
  marginTop: "5px",
  maxHeight: "250px",
  overflow: "auto",
  padding: "2px"
};

interface IColormapProps {
  updateColormap: (name: string) => Promise<void>,
  plotReady: boolean
};
interface IColormapState {
  selectedColormap: string,
  showEdit: boolean,
  showDropdown: boolean
  colormapChanged: boolean
};

export default class ColormapEditor extends React.Component<
  IColormapProps,
  IColormapState
> {
  constructor(props: IColormapProps){
    super(props);
    this.state = {
      selectedColormap: "viridis",
      showEdit: false,
      showDropdown: false,
      colormapChanged: false
    };
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.selectColormap = this.selectColormap.bind(this);
  }

  public toggleDropdown(): void {
    this.setState({
      showDropdown: !this.state.showDropdown
    });
  }

  public selectColormap(name: string): void {
    this.setState({
      selectedColormap: name,
      colormapChanged: true
    });
    this.props.updateColormap(name);
  }

  public render(): JSX.Element {
    return (
      <div>
        <Dropdown
          style={{ maxWidth: "calc(100% - 70px)", marginTop: "1em" }}
          isOpen={this.state.showDropdown}
          toggle={this.toggleDropdown}
        >
          <DropdownToggle
            className={"graphics-dropdown-vcdat"}
            disabled={!this.props.plotReady}
            caret={true}
          >
            {this.state.colormapChanged ? 
              this.state.selectedColormap: "Select Colormap"}
          </DropdownToggle>
          <DropdownMenu style={dropdownMenuStyle}>
            {Object.keys(default_colormaps).map((value:string, index:number) => {
              let cm_name = default_colormaps[index];
              const selectCM = () => {
                this.selectColormap(cm_name)
              }
              return (
                <DropdownItem
                  className={"graphics-dropdown-item-vcdat"}
                  onClick={selectCM}
                  key={cm_name}
                >
                  {cm_name}
                </DropdownItem>
              );
            })}
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }
}