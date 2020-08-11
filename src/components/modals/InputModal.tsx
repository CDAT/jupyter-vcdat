// Dependencies
import * as React from "react";
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
import { ISignal, Signal } from "@lumino/signaling";
import ColorFunctions from "../../modules/utils/ColorFunctions";
import { boundMethod } from "autobind-decorator";

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
  placeHolder: string;
  title: string;
  inputListHeader?: string;
  inputOptions?: string[];
  invalidInputMessage?: string;
  isValid?: (input: string) => boolean;
  sanitizer?: (input: string) => string;
}

interface IInputModalState {
  modalOpen: boolean; // Whether a modal is currently open
  input: string; // The current string input in the modal
  savedInput: string[]; // The list of input options aviailable
  showSaved: boolean; // Whether to show a list of saved input
  isValid: boolean; // Set to true if current input is valid
}

export default class InputModal extends React.Component<
  IInputModalProps,
  IInputModalState
> {
  private _savedChanged: Signal<this, string[]>;
  constructor(props: IInputModalProps) {
    super(props);
    this.state = {
      input: "",
      isValid: this.props.isValid ? this.props.isValid("") : true,
      modalOpen: false,
      savedInput: this.props.inputOptions
        ? this.props.inputOptions
        : Array<string>(),
      showSaved: this.props.inputOptions ? true : false,
    };
    this._savedChanged = new Signal<this, string[]>(this);
  }

  get savedOptionsChanged(): ISignal<this, string[]> {
    return this._savedChanged;
  }

  @boundMethod
  public async show(): Promise<void> {
    await this.setState({ modalOpen: true });
  }

  @boundMethod
  public async toggle(): Promise<void> {
    await this.setState({ modalOpen: !this.state.modalOpen });
  }

  @boundMethod
  public async reset(): Promise<void> {
    await this.setState({
      input: "",
      isValid: this.props.isValid ? this.props.isValid("") : true,
    });
  }

  public render(): JSX.Element {
    const colors: string[] = ColorFunctions.createGradient(
      this.state.savedInput.length,
      START_COLOR,
      END_COLOR
    );
    return (
      <Modal
        isOpen={this.state.modalOpen}
        toggle={this.toggle}
        size="lg"
        onClosed={this.reset}
      >
        <ModalHeader>{this.props.title}</ModalHeader>
        <ModalBody
          className={
            /* @tag<text-muted input-modal>*/ "text-muted input-modal-vcdat"
          }
        >
          {this.state.input === ""
            ? this.props.message
            : this.state.isValid
            ? ""
            : this.props.invalidInputMessage
            ? this.props.invalidInputMessage
            : INVALID_INPUT_MSG_DEFAULT}
          <InputGroup>
            <Input
              id={/* @tag<input-modal-input>*/ "input-modal-input-vcdat"}
              onChange={this.handleUpdate}
              placeholder={this.props.placeHolder}
              value={this.state.input}
              onKeyPress={this.enterPressed}
            />
            {this.state.showSaved && (
              <Button
                disabled={this.state.input === ""}
                color="success"
                onClick={this.saveInput}
              >
                Save
              </Button>
            )}
          </InputGroup>
          {this.state.savedInput && this.state.savedInput.length > 0 && (
            <ListGroup
              style={listGroupStyle}
              className={
                /* @tag<input-modal-options-list>*/ "input-modal-options-list-vcdat"
              }
            >
              {this.props.inputListHeader
                ? this.props.inputListHeader
                : OPTIONS_HEADER_DEFAULT}
              {this.state.savedInput.map((item: string, idx: number) => {
                const clickSavedInput = (): void => {
                  this.handleClickSavedInput(item);
                };
                const deleteInput = (
                  event: React.MouseEvent<any, MouseEvent>
                ): void => {
                  event.stopPropagation();
                  this.deleteInput(idx);
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
                      onClick={deleteInput}
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
            outline={!this.state.input}
            color={this.state.isValid ? "info" : "danger"}
            onClick={this.hide}
          >
            {this.state.isValid ? this.props.acceptText : this.props.cancelText}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  @boundMethod
  private async saveInput(): Promise<void> {
    const newList: string[] = this.state.savedInput;
    await this.setState({ savedInput: [this.state.input].concat(newList) });
    this._savedChanged.emit(this.state.savedInput); // Publish that saved options changed
  }

  @boundMethod
  private async deleteInput(index: number): Promise<void> {
    const newList: string[] = this.state.savedInput;
    newList.splice(index, 1);
    await this.setState({ savedInput: newList });
    this._savedChanged.emit(this.state.savedInput); // Publish that saved options changed
  }

  @boundMethod
  private async handleClickSavedInput(savedInput: string): Promise<void> {
    this.validate(savedInput);
  }

  @boundMethod
  private async hide(): Promise<void> {
    // If the input was not valid, cancel hide operation with message
    if (this.state.isValid) {
      this.props.onModalClose(this.state.input, this.state.savedInput);
    }

    await this.setState({ modalOpen: false, input: "" });
  }

  @boundMethod
  private async enterPressed(
    event: React.KeyboardEvent<HTMLInputElement>
  ): Promise<void> {
    const code = event.keyCode || event.which;
    if (code === 13) {
      if (this.state.isValid) {
        this.props.onModalClose(this.state.input, this.state.savedInput);
        await this.setState({ modalOpen: false, input: "" });
      }
    }
  }

  @boundMethod
  private async validate(input: string): Promise<void> {
    let newInput: string = input;
    // Clean input if necessary
    if (this.props.sanitizer) {
      newInput = this.props.sanitizer(newInput);
    }

    // Validat input if necessary
    if (this.props.isValid) {
      await this.setState({ isValid: this.props.isValid(newInput) });
    } else {
      this.setState({ isValid: true });
    }

    // Update current input state
    await this.setState({ input: newInput });
  }

  @boundMethod
  private async handleUpdate(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    event.persist();
    const start: number = event.target.selectionStart;
    const end: number = event.target.selectionEnd;
    await this.validate(event.target.value);
    event.target.setSelectionRange(start, end, "forward");
  }
}
