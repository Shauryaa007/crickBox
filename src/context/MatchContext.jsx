import { createContext, useContext, useReducer, useCallback } from 'react';
import { applyAction, ACTION_TYPES } from '../lib/matchEngine';

const MatchContext = createContext(null);

function matchReducer(state, reducerAction) {
    switch (reducerAction.type) {
        case 'SET_STATE':
            return { ...reducerAction.payload };
        case 'APPLY_ACTION': {
            const { newState } = applyAction(state.current, reducerAction.action);
            return {
                ...state,
                current: newState,
                history: [...state.history, { previousState: state.current, action: reducerAction.action }],
            };
        }
        case 'UNDO': {
            if (state.history.length === 0) return state;
            const newHistory = [...state.history];
            const lastEntry = newHistory.pop();
            return {
                ...state,
                current: lastEntry.previousState,
                history: newHistory,
            };
        }
        case 'SET_CURRENT':
            return { ...state, current: { ...state.current, ...reducerAction.payload } };
        default:
            return state;
    }
}

export function MatchProvider({ children, initialState }) {
    const [state, dispatch] = useReducer(matchReducer, {
        current: initialState,
        history: [],
    });

    const scoreRun = useCallback((runs) => {
        dispatch({
            type: 'APPLY_ACTION',
            action: { type: ACTION_TYPES.RUN, payload: { runs } },
        });
    }, []);

    const scoreWicket = useCallback((outBatsmanId, newBatsmanId, dismissalType = 'out') => {
        dispatch({
            type: 'APPLY_ACTION',
            action: {
                type: ACTION_TYPES.WICKET,
                payload: { outBatsmanId, newBatsmanId, dismissalType },
            },
        });
    }, []);

    const scoreNoBall = useCallback((runs = 0) => {
        dispatch({
            type: 'APPLY_ACTION',
            action: { type: ACTION_TYPES.NO_BALL, payload: { runs } },
        });
    }, []);

    const scoreWide = useCallback((runs = 0) => {
        dispatch({
            type: 'APPLY_ACTION',
            action: { type: ACTION_TYPES.WIDE, payload: { runs } },
        });
    }, []);

    const togglePowerplay = useCallback(() => {
        dispatch({
            type: 'APPLY_ACTION',
            action: { type: ACTION_TYPES.TOGGLE_POWERPLAY, payload: {} },
        });
    }, []);

    const undo = useCallback(() => {
        dispatch({ type: 'UNDO' });
    }, []);

    const updateCurrent = useCallback((partial) => {
        dispatch({ type: 'SET_CURRENT', payload: partial });
    }, []);

    return (
        <MatchContext.Provider value={{
            matchState: state.current,
            history: state.history,
            scoreRun,
            scoreWicket,
            scoreNoBall,
            scoreWide,
            togglePowerplay,
            undo,
            updateCurrent,
            canUndo: state.history.length > 0,
        }}>
            {children}
        </MatchContext.Provider>
    );
}

export function useMatch() {
    const context = useContext(MatchContext);
    if (!context) throw new Error('useMatch must be used within MatchProvider');
    return context;
}
