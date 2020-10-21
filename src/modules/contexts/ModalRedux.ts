export type ModalAction =
  | { type: "show"; modalID: string }
  | { type: "hide" }
  | { type: "toggle"; modalID: string };

export type ModalState = { modalOpen: string | null };
export type ModalDispatch = (action: ModalAction) => void;

export const initialModalState: ModalState = {
  modalOpen: null,
};

// Action creator
export const ModalActions = {
  show: (id: string): ModalAction => {
    return { type: "show", modalID: id };
  },
  hide: (): ModalAction => {
    return { type: "hide" };
  },
  toggle: (id: string): ModalAction => {
    return { type: "toggle", modalID: id };
  },
};

// Reducer
export function modalReducer(
  state: ModalState,
  action: ModalAction
): ModalState {
  switch (action.type) {
    case "show": {
      return { ...state, modalOpen: action.modalID };
    }
    case "hide": {
      return { ...state, modalOpen: "none" };
    }
    case "toggle": {
      if (state.modalOpen === "none") {
        return { ...state, modalOpen: action.modalID };
      } else {
        return { ...state, modalOpen: "none" };
      }
    }
    default: {
      return state;
    }
  }
}
