import {
  compose,
  combineReducers,
  applyMiddleware,
  createStore,
  Store,
  CombinedState,
  AnyAction,
} from "redux";
import thunkMiddleware from "redux-thunk";
import vcdatApp from "../reducers/vcdatApp";
import { IState } from "../types";
import { DISPLAY_MODE, NOTEBOOK_STATE } from "../../constants";

// Initial app state
export const initState: IState = {
  notebookState: {
    kernelId: "",
    notebook: undefined,
    varState: {
      selectedVariables: [],
      loadedVariables: [],
      derivedVariables: [],
    },
    status: NOTEBOOK_STATE.Unknown,
  },
  displayMode: DISPLAY_MODE.None,
};

/**
 * To use the redux devtools within chrome for debugging/development
 * install the devTools extension to the browser you're using.
 * https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en
 */
export default function configureStore(): Store<IState, AnyAction> {
  const rootReducer = combineReducers(vcdatApp);
  const composeEnhancers =
    // eslint-disable-next-line no-underscore-dangle
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = createStore(
    vcdatApp,
    composeEnhancers(applyMiddleware(thunkMiddleware))
  );

  return store;
}
