// Dependencies
import React, { useState } from "react";
import {
  Button,
  Input,
  InputGroup,
  ListGroup,
  ListGroupItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import ColorFunctions from "../../modules/utilities/ColorFunctions";
import { useModal } from "../../modules/contexts/ModalContext";

const INVALID_INPUT_MSG_DEFAULT =
  "The text entered is not valid. Please try again or cancel.";

const OPTIONS_HEADER_DEFAULT = "Recently Used:";

const START_COLOR = "#ff0000";
const END_COLOR = "#702030";

const listGroupStyle: React.CSSProperties = {
  margin: "10px",
  maxHeight: "250px",
  overflowY: "auto",
};

const listGroupItemStyle: React.CSSProperties = {
  overflowWrap: "break-word",
};

interface IInputModalProps {
  acceptText: string;
  cancelText: string;
  message: string;
  onModalClose: (input: string, savedInput: string[]) => void;
  onSavedOptionsChanged: (savedInput: string[]) => void;
  placeHolder: string;
  title: string;
  inputListHeader?: string;
  inputOptions?: string[];
  invalidInputMessage?: string;
  isValid?: (input: string) => boolean;
  sanitizer?: (input: string) => string;
  modalID: string;
}

interface IInputModalState {
  // modalOpen: boolean; // Whether a modal is currently open
  input: string; // The current string input in the modal
  savedInput: string[]; // The list of input options aviailable
  showSaved: boolean; // Whether to show a list of saved input
  isValid: boolean; // Set to true if current input is valid
}

const InputModal = (props: IInputModalProps): JSX.Element => {
  const [modalState, modalDispatch] = useModal();

  const hide = (): void => {
    modalDispatch({ type: "hideModal" });
    if (state.isValid) {
      props.onModalClose(state.input, state.savedInput);
    }

    setState({ ...state, input: "" });
  };

  const toggle = (): void => {
    modalDispatch({ type: "toggleModal", modalID: props.modalID });
  };

  const reset = (): void => {
    setState({
      ...state,
      input: "",
      isValid: props.isValid ? props.isValid("") : true,
    });
  };

  const [state, setState] = useState<IInputModalState>({
    input: "",
    isValid: props.isValid ? props.isValid("") : true,
    savedInput: props.inputOptions ? props.inputOptions : Array<string>(),
    showSaved: props.inputOptions ? true : false,
  });

  const saveInput = (): void => {
    const newList: string[] = state.savedInput;
    setState({ ...state, savedInput: [state.input].concat(newList) });
    props.onSavedOptionsChanged(state.savedInput);
  };

  const deleteInput = (index: number): void => {
    const newList: string[] = state.savedInput;
    newList.splice(index, 1);
    setState({ ...state, savedInput: newList });
    props.onSavedOptionsChanged(state.savedInput);
  };

  const handleClickSavedInput = (savedInput: string): void => {
    validate(savedInput);
  };

  const enterPressed = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const code = event.keyCode || event.which;
    if (code === 13) {
      if (state.isValid) {
        props.onModalClose(state.input, state.savedInput);
        setState({ ...state, input: "" });
        modalDispatch({ type: "hideModal" });
      }
    }
  };

  const validate = (input: string): void => {
    let newInput: string = input;
    // Clean input if necessary
    if (props.sanitizer) {
      newInput = props.sanitizer(newInput);
    }

    // Validat input if necessary
    if (props.isValid) {
      setState({ ...state, isValid: props.isValid(newInput) });
    } else {
      setState({ ...state, isValid: true });
    }

    // Update current input state
    setState({ ...state, input: newInput });
  };

  const handleUpdate = (event: React.ChangeEvent<HTMLInputElement>): void => {
    event.persist();
    const start: number = event.target.selectionStart;
    const end: number = event.target.selectionEnd;
    validate(event.target.value);
    event.target.setSelectionRange(start, end, "forward");
  };

  const colors: string[] = ColorFunctions.createGradient(
    state.savedInput.length,
    START_COLOR,
    END_COLOR
  );
  return (
    <Modal
      isOpen={modalState.modalOpen === props.modalID}
      toggle={toggle}
      size="lg"
      onClosed={reset}
    >
      <ModalHeader>{props.title}</ModalHeader>
      <ModalBody
        className={
          /* @tag<text-muted input-modal>*/ "text-muted input-modal-vcdat"
        }
      >
        {state.input === ""
          ? props.message
          : state.isValid
          ? ""
          : props.invalidInputMessage
          ? props.invalidInputMessage
          : INVALID_INPUT_MSG_DEFAULT}
        <InputGroup>
          <Input
            id={/* @tag<input-modal-input>*/ "input-modal-input-vcdat"}
            onChange={handleUpdate}
            placeholder={props.placeHolder}
            value={state.input}
            onKeyPress={enterPressed}
          />
          {state.showSaved && (
            <Button
              disabled={state.input === ""}
              color="success"
              onClick={saveInput}
            >
              Save
            </Button>
          )}
        </InputGroup>
        {state.savedInput && state.savedInput.length > 0 && (
          <ListGroup
            style={listGroupStyle}
            className={
              /* @tag<input-modal-options-list>*/ "input-modal-options-list-vcdat"
            }
          >
            {props.inputListHeader
              ? props.inputListHeader
              : OPTIONS_HEADER_DEFAULT}
            {state.savedInput.map((item: string, idx: number) => {
              const clickSavedInput = (): void => {
                handleClickSavedInput(item);
              };
              const deleteClickInput = (
                event: React.MouseEvent<any, MouseEvent>
              ): void => {
                event.stopPropagation();
                deleteInput(idx);
              };
              return (
                <ListGroupItem
                  key={idx}
                  action={true}
                  style={listGroupItemStyle}
                  onClick={clickSavedInput}
                  className="clear-fix"
                >
                  {item}
                  <Button
                    className="float-right"
                    style={{ backgroundColor: colors[idx] }}
                    onClick={deleteClickInput}
                  >
                    X
                  </Button>
                </ListGroupItem>
              );
            })}
          </ListGroup>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          className={/* @tag<input-modal-btn>*/ "input-modal-btn-vcdat"}
          outline={!state.input}
          color={state.isValid ? "info" : "danger"}
          onClick={hide}
        >
          {state.isValid ? props.acceptText : props.cancelText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default InputModal;
