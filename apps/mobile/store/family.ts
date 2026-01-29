import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateMemberId,
  type FamilyMember,
  type Relationship,
} from '@/services/familySharing';

interface FamilyStore {
  // State
  members: FamilyMember[];
  selectedMemberIds: string[];

  // Getters
  getMember: (id: string) => FamilyMember | undefined;
  getMembersByRelationship: (relationship: Relationship) => FamilyMember[];

  // Actions
  addMember: (
    name: string,
    relationship: Relationship,
    options?: { birthYear?: number; notes?: string }
  ) => string;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  removeMember: (id: string) => void;
  setMemberGenomeData: (
    id: string,
    filename: string,
    variantCount: number
  ) => void;
  clearMemberGenomeData: (id: string) => void;
  selectMember: (id: string) => void;
  deselectMember: (id: string) => void;
  toggleMemberSelection: (id: string) => void;
  clearSelection: () => void;
  clearAllMembers: () => void;
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      // Initial State
      members: [],
      selectedMemberIds: [],

      // Getters
      getMember: (id) => {
        return get().members.find((m) => m.id === id);
      },

      getMembersByRelationship: (relationship) => {
        return get().members.filter((m) => m.relationship === relationship);
      },

      // Actions
      addMember: (name, relationship, options = {}) => {
        const id = generateMemberId();
        const now = new Date().toISOString();

        const newMember: FamilyMember = {
          id,
          name,
          relationship,
          birthYear: options.birthYear,
          notes: options.notes,
          createdAt: now,
          updatedAt: now,
          hasGenomeData: false,
        };

        set((state) => ({
          members: [...state.members, newMember],
        }));

        return id;
      },

      updateMember: (id, updates) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? { ...member, ...updates, updatedAt: new Date().toISOString() }
              : member
          ),
        })),

      removeMember: (id) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
          selectedMemberIds: state.selectedMemberIds.filter((mid) => mid !== id),
        })),

      setMemberGenomeData: (id, filename, variantCount) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? {
                  ...member,
                  hasGenomeData: true,
                  genomeFilename: filename,
                  variantCount,
                  updatedAt: new Date().toISOString(),
                }
              : member
          ),
        })),

      clearMemberGenomeData: (id) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? {
                  ...member,
                  hasGenomeData: false,
                  genomeFilename: undefined,
                  variantCount: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : member
          ),
        })),

      selectMember: (id) =>
        set((state) => ({
          selectedMemberIds: state.selectedMemberIds.includes(id)
            ? state.selectedMemberIds
            : [...state.selectedMemberIds, id],
        })),

      deselectMember: (id) =>
        set((state) => ({
          selectedMemberIds: state.selectedMemberIds.filter((mid) => mid !== id),
        })),

      toggleMemberSelection: (id) =>
        set((state) => ({
          selectedMemberIds: state.selectedMemberIds.includes(id)
            ? state.selectedMemberIds.filter((mid) => mid !== id)
            : [...state.selectedMemberIds, id],
        })),

      clearSelection: () =>
        set({
          selectedMemberIds: [],
        }),

      clearAllMembers: () =>
        set({
          members: [],
          selectedMemberIds: [],
        }),
    }),
    {
      name: 'genomeforge-family',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        members: state.members,
      }),
    }
  )
);
