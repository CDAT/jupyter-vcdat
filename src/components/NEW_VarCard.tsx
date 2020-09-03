// Dependencies
import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Col,
  Collapse,
  Input,
  InputGroup,
  InputGroupAddon,
  Row,
} from "reactstrap";

// Project Components
import NotebookUtilities from "../modules/Utilities/NotebookUtilities";
import AxisInfo from "../modules/types/AxisInfo";
import DimensionSlider from "./DimensionSlider";
import Variable from "../modules/types/Variable";
import { IVarLoaderState } from "./modals/NEW_VarLoader";

const cardStyle: React.CSSProperties = {
  margin: ".5em",
};
const centered: React.CSSProperties = {
  margin: "auto",
};
const axisStyle: React.CSSProperties = {
  marginTop: "0.5em",
};
const buttonsStyle: React.CSSProperties = {
  width: "inherit",
};
// Regex filter for unallowed variable names
const forbidden = /^[^a-z_]|[^a-z0-9_]+/i;

type NameStatus =
  | "Invalid!"
  | "Name already loaded!"
  | "Name already selected!"
  | "Valid";

interface IVarCardProps {
  variable: Variable;
  selected: boolean;
  varAliasExists: (varAlias: string, varLoaderSelection: boolean) => boolean; // Method that returns true if specified variable name is already taken
  selectVariable: (variable: Variable) => void; // method to call to add this variable to the list to get loaded
  deselectVariable: (variable: Variable) => void; // method to call to remove a variable from the list
  isSelected: (varAlias: string) => boolean; // method to check if this variable is selected in parent
}
interface IVarCardState {
  variable: Variable;
  nameValue: string;
  showAxis: boolean;
  axisState: any;
  nameState: NameStatus;
  selected: boolean;
}

const VarCard = (props: IVarCardProps): JSX.Element => {
  const initialState: IVarCardState = {
    axisState: [],
    nameState: "Valid",
    nameValue: "",
    showAxis: false,
    variable: props.variable,
    selected: props.selected,
  };

  const [state, setState] = useState<IVarCardState>(initialState);

  /**
   * @description sets the isSelected attribute, and propagates up the selection action to the parent
   */
  const clickVariable = (): void => {
    const isSelected: boolean = props.isSelected(state.variable.varID);
    if (isSelected) {
      props.deselectVariable(state.variable);
    } else {
      props.selectVariable(state.variable);
    }
    setState({
      ...state,
      nameState: "Valid",
      nameValue: "",
      selected: !isSelected,
    });
  };

  /**
   * @description open the menu if its closed
   */
  const openMenu = (): void => {
    if (!state.showAxis && state.selected) {
      setState({ ...state, showAxis: true });
    }
  };

  const updateDimensionInfo = (newInfo: any): void => {
    const updatedVar: Variable = state.variable;
    updatedVar.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
      if (axis.name !== newInfo.name) {
        return;
      }
      updatedVar.axisInfo[axisIndex].first = newInfo.first;
      updatedVar.axisInfo[axisIndex].last = newInfo.last;
    });
    setState({ ...state, variable: updatedVar });
  };

  const validateNameInput = async (nameEntry: string): Promise<void> => {
    const invalid: boolean = forbidden.test(nameEntry);
    let validState: NameStatus = "Valid";
    if (nameEntry === "" || invalid) {
      validState = "Invalid!";
    } else if (props.varAliasExists(nameEntry, true)) {
      validState = "Name already selected!";
    } else if (props.varAliasExists(nameEntry, false)) {
      validState = "Name already loaded!";
    }
    await setState({ ...state, nameState: validState });
  };

  const handleNameInput = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const nameEntry: string = event.target.value;
    await validateNameInput(nameEntry);

    if (state.nameState !== "Invalid!") {
      const updatedVariable: Variable = state.variable;
      updatedVariable.alias = nameEntry;
      setState({ ...state, variable: updatedVariable });
    }

    setState({ ...state, nameValue: nameEntry });
  };

  const handleAxesClick = (): void => {
    setState({ ...state, showAxis: !state.showAxis });
  };

  const handleWarningsClick = (): void => {
    NotebookUtilities.showMessage(
      "Warning",
      `Loading '${state.variable.alias}' from this file will \
      overwrite the current '${state.variable.alias}' variable. \
      Rename this variable if you don't want to overwrite the \
      previously loaded variable.`,
      "Dismiss"
    );
  };

  // Set the input color
  let nameStateColor = "success";
  if (
    state.nameState === "Invalid!" ||
    state.nameState === "Name already selected!"
  ) {
    nameStateColor = "danger";
  } else if (state.nameState === "Name already loaded!") {
    nameStateColor = "warning";
  }

  return (
    <div>
      <Card style={cardStyle}>
        <CardBody
          data-name={props.variable.name}
          data-alias={props.variable.alias}
        >
          <CardTitle>
            <div style={centered}>
              <Row className={/* @tag<varcard-main>*/ "varcard-main-vcdat"}>
                <Col xs="sm-5">
                  <Button
                    className={
                      /* @tag<varcard-name-btn>*/ "varcard-name-btn-vcdat"
                    }
                    outline={true}
                    color={"success"}
                    onClick={clickVariable}
                    active={state.selected}
                    style={buttonsStyle}
                  >
                    {state.variable.alias}
                  </Button>
                </Col>
                <Col xs="sm-4">
                  {state.selected && (
                    <Button
                      className={
                        /* @tag<varcard-axes-btn>*/ "varcard-axes-btn-vcdat"
                      }
                      outline={true}
                      color={"danger"}
                      active={state.showAxis}
                      onClick={handleAxesClick}
                      style={buttonsStyle}
                    >
                      Edit
                    </Button>
                  )}
                </Col>
                {
                  // Check variable is selected before checking if alias exists for better performance
                  state.selected &&
                    props.varAliasExists(state.variable.alias, false) && (
                      <Col xs="sm-3">
                        <Button
                          className={
                            /* @tag<varcard-warning-btn>*/ "varcard-warning-btn-vcdat"
                          }
                          color={"warning"}
                          onClick={handleWarningsClick}
                        >
                          !
                        </Button>
                      </Col>
                    )
                }
              </Row>
            </div>
          </CardTitle>
          <Collapse
            isOpen={state.selected && state.showAxis}
            onClick={openMenu}
          >
            {state.selected && (
              <Card>
                <CardBody
                  className={
                    /* @tag<varcard-rename-field>*/ "varcard-rename-field-vcdat"
                  }
                >
                  <InputGroup style={{ marginTop: "5px" }}>
                    <InputGroupAddon addonType="prepend">
                      Rename Variable:
                    </InputGroupAddon>
                    <Input
                      onChange={handleNameInput}
                      className={
                        /* @tag<float-left varcard-rename-input>*/ "float-left varcard-rename-input-vcdat"
                      }
                      value={state.nameValue}
                      placeholder="Enter new name here."
                    />
                    <InputGroupAddon addonType="append">
                      <Button
                        className={
                          /* @tag<float-right varcard-rename-status>*/ "float-right varcard-rename-status-vcdat"
                        }
                        color={nameStateColor}
                        disabled={true}
                      >
                        {state.nameState}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </CardBody>
              </Card>
            )}
            {state.showAxis &&
              state.variable.axisInfo.map((item: AxisInfo) => {
                if (!item.data || item.data.length <= 1) {
                  return;
                }
                item.updateDimInfo = updateDimensionInfo;
                return (
                  <div key={item.name} style={axisStyle}>
                    <Card>
                      <CardBody
                        className={
                          /* @tag<varcard-dimension>*/ "varcard-dimension-vcdat"
                        }
                      >
                        <DimensionSlider
                          {...item}
                          varID={state.variable.varID}
                        />
                      </CardBody>
                    </Card>
                  </div>
                );
              })}
          </Collapse>
        </CardBody>
        <CardFooter />
      </Card>
    </div>
  );
};

export default VarCard;
