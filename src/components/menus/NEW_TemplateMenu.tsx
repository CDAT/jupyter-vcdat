// Dependencies
import React from "react";
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

import { useApp } from "../../modules/contexts/AppContext";
import { usePlot, PlotAction } from "../../modules/contexts/PlotContext";

const dropdownMenuStype: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto",
};
interface ITemplateMenuProps {
  showDropdown: boolean;
  setDropdown: (showDropdown: boolean) => void;
}

const TemplateMenu = (props: ITemplateMenuProps): JSX.Element => {
  const [appState] = useApp();
  const [plotState, plotDispatch] = usePlot();

  const toggleDropdown = (): void => {
    props.setDropdown(!props.showDropdown);
  };

  let dropDownTitle: string = plotState.selectedTemplate;
  if (plotState.selectedTemplate === "") {
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
            <Dropdown isOpen={props.showDropdown} toggle={toggleDropdown}>
              <DropdownToggle
                className={
                  /* @tag<template-dropdown>*/ "template-dropdown-vcdat"
                }
                disabled={!plotState.plotReady}
                caret={true}
              >
                {dropDownTitle}
              </DropdownToggle>
              {props.showDropdown && (
                <DropdownMenu style={dropdownMenuStype}>
                  {appState.templates.map((item: string) => {
                    const handleClick = (): void => {
                      plotDispatch(PlotAction.selectTemplate(item));
                      props.setDropdown(false);
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
};

export default TemplateMenu;
