import { create } from 'zustand';
import { PositionsStatus } from '@/types/position-filter-status';
import { createJSONStorage, persist } from 'zustand/middleware';
import deepMerge from 'lodash.merge'

type FilteredPositions = {
    [key in PositionsStatus]: boolean;
};

type FilterStore = {
    filterStatus: FilteredPositions;
    handleSwitchToggle: (positionStatus: PositionsStatus) => void;
    reset: () => void;
};

export const usePositionFilterStore = create(persist<FilterStore>((set) => ({
    filterStatus: {
        [PositionsStatus.ACTIVE]: true,
        [PositionsStatus.ON_FARMING]: true,
        [PositionsStatus.CLOSED]: false,
    },
    handleSwitchToggle: (positionStatus: PositionsStatus) => {
        set((state) => ({
            filterStatus: {
                ...state.filterStatus,
                [positionStatus]: !state.filterStatus[positionStatus],
            },
        }));
    },
    reset: () =>
        set({
            filterStatus: {
                [PositionsStatus.ACTIVE]: true,
                [PositionsStatus.ON_FARMING]: true,
                [PositionsStatus.CLOSED]: false,
            },
        }),
}), { name: 'position-filter-storage', storage: createJSONStorage(() => localStorage), merge: (persistedState, currentState) => deepMerge(currentState, persistedState)  }));