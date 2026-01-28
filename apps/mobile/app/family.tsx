import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFamilyStore } from '@/store/family';
import {
  type Relationship,
  getRelationshipLabel,
  getExpectedSharing,
} from '@/services/familySharing';

const relationships: Relationship[] = [
  'self',
  'parent',
  'child',
  'sibling',
  'grandparent',
  'grandchild',
  'aunt_uncle',
  'niece_nephew',
  'cousin',
  'spouse',
  'other',
];

export default function FamilyScreen() {
  const router = useRouter();
  const {
    members,
    addMember,
    updateMember,
    removeMember,
    selectedMemberIds,
    toggleMemberSelection,
    clearSelection,
  } = useFamilyStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('parent');
  const [birthYear, setBirthYear] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setRelationship('parent');
    setBirthYear('');
    setNotes('');
  };

  const handleAddMember = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    addMember(name.trim(), relationship, {
      birthYear: birthYear ? parseInt(birthYear) : undefined,
      notes: notes.trim() || undefined,
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleEditMember = () => {
    if (!editingMember || !name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    updateMember(editingMember, {
      name: name.trim(),
      relationship,
      birthYear: birthYear ? parseInt(birthYear) : undefined,
      notes: notes.trim() || undefined,
    });

    resetForm();
    setEditingMember(null);
    setShowEditModal(false);
  };

  const handleDeleteMember = (id: string, memberName: string) => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${memberName} from your family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember(id),
        },
      ]
    );
  };

  const openEditModal = (id: string) => {
    const member = members.find((m) => m.id === id);
    if (member) {
      setName(member.name);
      setRelationship(member.relationship);
      setBirthYear(member.birthYear?.toString() || '');
      setNotes(member.notes || '');
      setEditingMember(id);
      setShowEditModal(true);
    }
  };

  const handleCompare = () => {
    if (selectedMemberIds.length < 2) {
      Alert.alert('Select Members', 'Please select at least 2 family members to compare');
      return;
    }

    // Navigate to comparison screen
    Alert.alert(
      'Compare Variants',
      'This will compare genetic variants between selected family members. Coming soon!'
    );
  };

  const getRelationshipIcon = (rel: Relationship): React.ComponentProps<typeof Ionicons>['name'] => {
    const icons: Record<Relationship, React.ComponentProps<typeof Ionicons>['name']> = {
      self: 'person',
      parent: 'person',
      child: 'happy',
      sibling: 'people',
      grandparent: 'person',
      grandchild: 'happy',
      aunt_uncle: 'person',
      niece_nephew: 'happy',
      cousin: 'people',
      spouse: 'heart',
      other: 'person-add',
    };
    return icons[rel] || 'person';
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Family',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="people" size={24} color="#2563eb" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Family Genetic Sharing</Text>
            <Text style={styles.infoDescription}>
              Add family members to compare genetic variants and understand inheritance
              patterns. All data stays on your device.
            </Text>
          </View>
        </View>

        {/* Selection Actions */}
        {selectedMemberIds.length > 0 && (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>
              {selectedMemberIds.length} selected
            </Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity style={styles.selectionButton} onPress={handleCompare}>
                <Ionicons name="git-compare" size={20} color="#2563eb" />
                <Text style={styles.selectionButtonText}>Compare</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectionButton} onPress={clearSelection}>
                <Ionicons name="close" size={20} color="#6b7280" />
                <Text style={[styles.selectionButtonText, { color: '#6b7280' }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Family Members List */}
        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>No Family Members</Text>
            <Text style={styles.emptyDescription}>
              Add family members to compare genetic variants and explore inheritance patterns.
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((member) => {
              const isSelected = selectedMemberIds.includes(member.id);
              const expectedSharing = getExpectedSharing(member.relationship);

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.memberCard, isSelected && styles.memberCardSelected]}
                  onPress={() => toggleMemberSelection(member.id)}
                  onLongPress={() => openEditModal(member.id)}
                >
                  <View style={styles.memberCheckbox}>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.memberIcon,
                      { backgroundColor: isSelected ? '#2563eb' : '#e5e7eb' },
                    ]}
                  >
                    <Ionicons
                      name={getRelationshipIcon(member.relationship)}
                      size={24}
                      color={isSelected ? '#fff' : '#6b7280'}
                    />
                  </View>

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRelationship}>
                      {getRelationshipLabel(member.relationship)}
                      {member.birthYear && ` • Born ${member.birthYear}`}
                    </Text>
                    <View style={styles.memberMeta}>
                      {member.hasGenomeData ? (
                        <View style={styles.metaBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#059669" />
                          <Text style={styles.metaBadgeText}>
                            {member.variantCount?.toLocaleString()} variants
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.metaBadge, styles.metaBadgeEmpty]}>
                          <Ionicons name="alert-circle" size={14} color="#f59e0b" />
                          <Text style={[styles.metaBadgeText, { color: '#f59e0b' }]}>
                            No genetic data
                          </Text>
                        </View>
                      )}
                      {expectedSharing > 0 && (
                        <View style={styles.sharingBadge}>
                          <Text style={styles.sharingText}>
                            ~{(expectedSharing * 100).toFixed(0)}% shared DNA
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => openEditModal(member.id)}
                    >
                      <Ionicons name="pencil" size={18} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteMember(member.id, member.name)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.privacyText}>
            Family data is stored locally on your device. No information is shared with
            external servers.
          </Text>
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
      >
        <MemberFormModal
          title="Add Family Member"
          name={name}
          setName={setName}
          relationship={relationship}
          setRelationship={setRelationship}
          birthYear={birthYear}
          setBirthYear={setBirthYear}
          notes={notes}
          setNotes={setNotes}
          onCancel={() => {
            resetForm();
            setShowAddModal(false);
          }}
          onSave={handleAddMember}
          saveLabel="Add Member"
        />
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          resetForm();
          setEditingMember(null);
          setShowEditModal(false);
        }}
      >
        <MemberFormModal
          title="Edit Family Member"
          name={name}
          setName={setName}
          relationship={relationship}
          setRelationship={setRelationship}
          birthYear={birthYear}
          setBirthYear={setBirthYear}
          notes={notes}
          setNotes={setNotes}
          onCancel={() => {
            resetForm();
            setEditingMember(null);
            setShowEditModal(false);
          }}
          onSave={handleEditMember}
          saveLabel="Save Changes"
        />
      </Modal>
    </View>
  );
}

function MemberFormModal({
  title,
  name,
  setName,
  relationship,
  setRelationship,
  birthYear,
  setBirthYear,
  notes,
  setNotes,
  onCancel,
  onSave,
  saveLabel,
}: {
  title: string;
  name: string;
  setName: (value: string) => void;
  relationship: Relationship;
  setRelationship: (value: Relationship) => void;
  birthYear: string;
  setBirthYear: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={modalStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={modalStyles.title}>{title}</Text>
        <TouchableOpacity onPress={onSave}>
          <Text style={modalStyles.saveText}>{saveLabel}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={modalStyles.content}>
        {/* Name Input */}
        <View style={modalStyles.field}>
          <Text style={modalStyles.label}>Name *</Text>
          <TextInput
            style={modalStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            autoFocus
          />
        </View>

        {/* Relationship Picker */}
        <View style={modalStyles.field}>
          <Text style={modalStyles.label}>Relationship *</Text>
          <View style={modalStyles.relationshipGrid}>
            {relationships.map((rel) => (
              <TouchableOpacity
                key={rel}
                style={[
                  modalStyles.relationshipOption,
                  relationship === rel && modalStyles.relationshipOptionSelected,
                ]}
                onPress={() => setRelationship(rel)}
              >
                <Text
                  style={[
                    modalStyles.relationshipText,
                    relationship === rel && modalStyles.relationshipTextSelected,
                  ]}
                >
                  {getRelationshipLabel(rel)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Birth Year */}
        <View style={modalStyles.field}>
          <Text style={modalStyles.label}>Birth Year (optional)</Text>
          <TextInput
            style={modalStyles.input}
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder="e.g., 1985"
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        {/* Notes */}
        <View style={modalStyles.field}>
          <Text style={modalStyles.label}>Notes (optional)</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about this family member"
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerButton: {
    padding: 8,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#3b82f6',
    lineHeight: 20,
  },
  selectionBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  memberCardSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  memberCheckbox: {
    width: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  memberIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  memberRelationship: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  memberMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  metaBadgeEmpty: {
    backgroundColor: '#fffbeb',
  },
  metaBadgeText: {
    fontSize: 12,
    color: '#059669',
  },
  sharingBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sharingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  relationshipOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  relationshipText: {
    fontSize: 14,
    color: '#374151',
  },
  relationshipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
});
