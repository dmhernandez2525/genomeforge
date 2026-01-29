import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  FlatList,
} from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';
import {
  searchVariants,
  getUniqueChromosomes,
  getUniqueGenes,
  getSuggestedSearchTerms,
  getFilterPresets,
  highlightMatches,
  type SearchFilters,
  type SearchResult,
  type SignificanceFilter,
  type CategoryFilter,
} from '@/services/variantSearch';

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  category: 'all',
  significance: 'all',
  chromosomes: [],
  genes: [],
};

export default function SearchScreen() {
  const router = useRouter();
  const { analysisResult } = useAnalysisStore();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChromosomes, setSelectedChromosomes] = useState<string[]>([]);
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);

  const chromosomes = useMemo(
    () => (analysisResult ? getUniqueChromosomes(analysisResult) : []),
    [analysisResult]
  );

  const genes = useMemo(
    () => (analysisResult ? getUniqueGenes(analysisResult) : []),
    [analysisResult]
  );

  const suggestions = useMemo(
    () => (analysisResult ? getSuggestedSearchTerms(analysisResult) : []),
    [analysisResult]
  );

  const presets = getFilterPresets();

  const { results, stats } = useMemo(() => {
    if (!analysisResult) {
      return { results: [], stats: { totalResults: 0, clinicalCount: 0, drugCount: 0, traitCount: 0, uniqueGenes: 0 } };
    }

    const currentFilters: SearchFilters = {
      ...filters,
      query,
      chromosomes: selectedChromosomes,
      genes: selectedGenes,
    };

    return searchVariants(analysisResult, currentFilters);
  }, [analysisResult, filters, query, selectedChromosomes, selectedGenes]);

  const handleResultPress = useCallback(
    (result: SearchResult) => {
      router.push(`/variant/${result.rsid}`);
    },
    [router]
  );

  const handlePresetPress = (preset: (typeof presets)[0]) => {
    setFilters((prev) => ({ ...prev, ...preset.filters }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedChromosomes([]);
    setSelectedGenes([]);
    setQuery('');
  };

  const toggleChromosome = (chr: string) => {
    setSelectedChromosomes((prev) =>
      prev.includes(chr) ? prev.filter((c) => c !== chr) : [...prev, chr]
    );
  };

  const toggleGene = (gene: string) => {
    setSelectedGenes((prev) =>
      prev.includes(gene) ? prev.filter((g) => g !== gene) : [...prev, gene]
    );
  };

  const getTypeIcon = (type: SearchResult['type']): React.ComponentProps<typeof Ionicons>['name'] => {
    switch (type) {
      case 'clinical':
        return 'medical';
      case 'drug':
        return 'medkit';
      case 'trait':
        return 'color-palette';
      default:
        return 'document';
    }
  };

  const getTypeColor = (type: SearchResult['type']): string => {
    switch (type) {
      case 'clinical':
        return '#dc2626';
      case 'drug':
        return '#7c3aed';
      case 'trait':
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };

  if (!analysisResult) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Search' }} />
        <View style={styles.emptyIconContainer}>
          <Ionicons name="search-outline" size={64} color="#d1d5db" />
        </View>
        <Text style={styles.emptyTitle}>No Analysis Data</Text>
        <Text style={styles.emptyDescription}>
          Upload and analyze your genetic data to search variants.
        </Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => router.push('/upload')}
        >
          <Text style={styles.uploadButtonText}>Upload DNA Data</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderResult = ({ item }: { item: SearchResult }) => {
    const titleParts = query ? highlightMatches(item.title, query) : [{ text: item.title, highlighted: false }];

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => handleResultPress(item)}
      >
        <View style={[styles.resultIcon, { backgroundColor: getTypeColor(item.type) + '20' }]}>
          <Ionicons name={getTypeIcon(item.type)} size={20} color={getTypeColor(item.type)} />
        </View>
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultRsid}>{item.rsid}</Text>
            {item.gene && (
              <View style={styles.geneBadge}>
                <Text style={styles.geneBadgeText}>{item.gene}</Text>
              </View>
            )}
          </View>
          <Text style={styles.resultTitle}>
            {titleParts.map((part, i) => (
              <Text key={i} style={part.highlighted ? styles.highlight : undefined}>
                {part.text}
              </Text>
            ))}
          </Text>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Search Variants' }} />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by rsID, gene, condition..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={20} color={showFilters ? '#fff' : '#2563eb'} />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <ScrollView style={styles.filtersPanel} horizontal={false}>
          {/* Quick Presets */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Quick Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.presetsRow}>
                {presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.presetChip}
                    onPress={() => handlePresetPress(preset)}
                  >
                    <Text style={styles.presetChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterChips}>
              {(['all', 'clinical', 'pharmacogenomics', 'traits'] as CategoryFilter[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, filters.category === cat && styles.filterChipSelected]}
                  onPress={() => setFilters((f) => ({ ...f, category: cat }))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.category === cat && styles.filterChipTextSelected,
                    ]}
                  >
                    {cat === 'all' ? 'All' : cat === 'pharmacogenomics' ? 'Drugs' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Significance Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Clinical Significance</Text>
            <View style={styles.filterChips}>
              {(['all', 'pathogenic', 'likely_pathogenic', 'vus', 'benign'] as SignificanceFilter[]).map((sig) => (
                <TouchableOpacity
                  key={sig}
                  style={[styles.filterChip, filters.significance === sig && styles.filterChipSelected]}
                  onPress={() => setFilters((f) => ({ ...f, significance: sig }))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.significance === sig && styles.filterChipTextSelected,
                    ]}
                  >
                    {sig === 'all' ? 'All' : sig === 'likely_pathogenic' ? 'Likely Path.' : sig === 'vus' ? 'VUS' : sig.charAt(0).toUpperCase() + sig.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chromosome Filter */}
          {chromosomes.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                Chromosomes {selectedChromosomes.length > 0 && `(${selectedChromosomes.length})`}
              </Text>
              <View style={styles.filterChips}>
                {chromosomes.slice(0, 12).map((chr) => (
                  <TouchableOpacity
                    key={chr}
                    style={[styles.filterChip, styles.filterChipSmall, selectedChromosomes.includes(chr) && styles.filterChipSelected]}
                    onPress={() => toggleChromosome(chr)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedChromosomes.includes(chr) && styles.filterChipTextSelected,
                      ]}
                    >
                      {chr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Reset Button */}
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Ionicons name="refresh" size={16} color="#6b7280" />
            <Text style={styles.resetButtonText}>Reset All Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Results Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {stats.totalResults} results
          {stats.clinicalCount > 0 && ` • ${stats.clinicalCount} clinical`}
          {stats.drugCount > 0 && ` • ${stats.drugCount} drugs`}
          {stats.traitCount > 0 && ` • ${stats.traitCount} traits`}
        </Text>
      </View>

      {/* Suggestions (when no query) */}
      {!query && results.length === 0 && suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Suggested Searches</Text>
          <View style={styles.suggestionsGrid}>
            {suggestions.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.suggestionChip}
                onPress={() => setQuery(term)}
              >
                <Ionicons name="search" size={14} color="#2563eb" />
                <Text style={styles.suggestionText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsHint}>Try adjusting your filters or search terms</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filtersPanel: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 300,
  },
  filterSection: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  presetChipText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipSmall: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  filterChipSelected: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    color: '#374151',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },
  statsText: {
    fontSize: 13,
    color: '#6b7280',
  },
  suggestionsSection: {
    padding: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
  },
  resultsList: {
    padding: 16,
    paddingTop: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  resultRsid: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  geneBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  geneBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  highlight: {
    backgroundColor: '#fef08a',
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 16,
  },
  noResultsHint: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
