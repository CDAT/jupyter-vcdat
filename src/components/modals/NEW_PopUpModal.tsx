// Dependencies
import * as React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useModal, ModalAction } from "../../modules/contexts/ModalContext";

interface IPopUpProps {
  message: string;
  btnText: string;
  title: string;
  modalID: string;
}

const PopUpModal = (props: IPopUpProps): JSX.Element => {
  const [modalState, modalDispatch] = useModal();

  const hide = (): void => {
    modalDispatch(ModalAction.hide());
  };

  const toggle = (): void => {
    modalDispatch(ModalAction.toggle(props.modalID));
  };

  return (
    <Modal
      isOpen={modalState.modalOpen === props.modalID}
      toggle={toggle}
      size="lg"
    >
      <ModalHeader>{props.title}</ModalHeader>
      <ModalBody className={/* @tag<popup-modal>*/ "popup-modal-vcdat"}>
        {props.message}
      </ModalBody>
      <ModalFooter>
        <Button
          className={/* @tag<popup-modal-btn>*/ "popup-modal-btn-vcdat"}
          outline={true}
          color="primary"
          onClick={hide}
        >
          {props.btnText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PopUpModal;
