// Dependencies
import * as React from "react";
import {
  Card,
  CardBody,
  CardSubtitle,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "reactstrap";
import { ISignal } from "@lumino/signaling";

import { LeftSideBarWidget } from "./../../LeftSideBarWidget";
import { boundMethod } from "autobind-decorator";

const dropdownMenuStype: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto",
};

interface ITemplateMenuProps {
  plotReady: boolean;
  plotReadyChanged: ISignal<LeftSideBarWidget, boolean>;
  getTemplatesList: () => string[]; // a method to call when the user has seleted a template
  updateTemplateOptions: (templateName: string) => Promise<void>;
}
interface ITemplateMenuState {
  showMenu: boolean;
  showDropdown: boolean;
  selectedTemplate: string;
  optionsChanged: boolean;
  plotReady: boolean;
}

export default class TemplateMenu extends React.Component<
  ITemplateMenuProps,
  ITemplateMenuState
> {
  constructor(props: ITemplateMenuProps) {
    super(props);
    this.state = {
      optionsChanged: false,
      plotReady: this.props.plotReady,
      selectedTemplate: "",
      showDropdown: false,
      showMenu: false,
    };

    this.props.plotReadyChanged.connect(this.handlePlotReadyChanged);
  }

  // Resets the graphics menu to initial, (for when a new notebook is selected)
  @boundMethod
  public resetTemplateMenuState(): void {
    this.setState({
      optionsChanged: false,
      selectedTemplate: "",
      showDropdown: false,
      showMenu: false,
    });
  }

  @boundMethod
  public toggleMenu(): void {
    this.setState({
      showMenu: !this.state.showMenu,
    });
  }

  @boundMethod
  public toggleDropdown(): void {
    this.setState({
      showDropdown: !this.state.showDropdown,
    });
  }

  public render(): JSX.Element {
    let dropDownTitle: string = this.state.selectedTemplate;
    if (this.state.selectedTemplate === "") {
      dropDownTitle = "Select A Template";
    }
    return (
      <div>
        <Card>
          <CardBody
            className={/* @tag<templatemenu-main>*/ "templatemenu-main-vcdat"}
          >
            <CardTitle>Layout Template</CardTitle>
            <CardSubtitle>
              <Dropdown
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle
                  className={
                    /* @tag<template-dropdown>*/ "template-dropdown-vcdat"
                  }
                  disabled={!this.state.plotReady}
                  caret={true}
                >
                  {dropDownTitle}
                </DropdownToggle>
                {this.state.showDropdown && (
                  <DropdownMenu style={dropdownMenuStype}>
                    {this.props.getTemplatesList().map((item: string) => {
                      const handleClick = (): void => {
                        this.props.updateTemplateOptions(item);
                        this.setState({
                          optionsChanged: false,
                          selectedTemplate: item,
                          showDropdown: false,
                          showMenu: false,
                        });
                      };
                      return (
                        <DropdownItem
                          className={
                            /* @tag<template-item>*/ "template-item-vcdat"
                          }
                          onClick={handleClick}
                          value={item}
                          key={item}
                        >
                          {item}
                        </DropdownItem>
                      );
                    })}
                  </DropdownMenu>
                )}
              </Dropdown>
            </CardSubtitle>
          </CardBody>
        </Card>
      </div>
    );
  }

  @boundMethod
  private handlePlotReadyChanged(
    sidebar: LeftSideBarWidget,
    value: boolean
  ): void {
    this.setState({ plotReady: value });
  }
}
