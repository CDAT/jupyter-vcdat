import * as React from "react";
import {
  CardGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle
} from "reactstrap";
import { BASE_COLORMAPS } from "../constants";

const dropdownMenuStyle: React.CSSProperties = {
  marginTop: "5px",
  maxHeight: "250px",
  overflow: "auto",
  padding: "2px"
};

interface IColormapProps {
  updateColormap: (name: string) => Promise<void>;
  plotReady: boolean;
}
interface IColormapState {
  selectedColormap: string;
  showEdit: boolean;
  showDropdown: boolean;
  colormapChanged: boolean;
}

export default class ColormapEditor extends React.Component<
  IColormapProps,
  IColormapState
> {
  constructor(props: IColormapProps) {
    super(props);
    this.state = {
      colormapChanged: false,
      selectedColormap: "viridis",
      showDropdown: false,
      showEdit: false
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
      colormapChanged: true,
      selectedColormap: name
    });
    this.props.updateColormap(name);
  }

  public render(): JSX.Element {
    return (
      <CardGroup>
        <Dropdown
          style={{ maxWidth: "calc(100% - 70px)", marginTop: "1em" }}
          isOpen={this.state.showDropdown}
          toggle={this.toggleDropdown}
        >
          <DropdownToggle
            className={/*@tag<colormap-dropdown>*/ "colormap-dropdown-vcdat"}
            disabled={!this.props.plotReady}
            caret={true}
          >
            {this.state.colormapChanged
              ? this.state.selectedColormap
              : "Select Colormap"}
          </DropdownToggle>
          <DropdownMenu style={dropdownMenuStyle}>
            {Object.keys(BASE_COLORMAPS).map((value: string, index: number) => {
              const cmName = BASE_COLORMAPS[index];
              const selectCM = () => {
                this.selectColormap(cmName);
              };
              return (
                <DropdownItem
                  className={
                    /*@tag<colormap-dropdown-item>*/ "colormap-dropdown-item-vcdat"
                  }
                  onClick={selectCM}
                  key={cmName}
                >
                  {cmName}
                </DropdownItem>
              );
            })}
          </DropdownMenu>
        </Dropdown>
      </CardGroup>
    );
  }
}
