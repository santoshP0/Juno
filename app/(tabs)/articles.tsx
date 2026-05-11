import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bookmark, BookmarkCheck, Clock, ChevronRight } from 'lucide-react-native';

import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/widgets/EmptyState';
import { useColors } from '../../hooks/useTheme';
import { useCycleStore } from '../../stores/cycleStore';
import { useSQLiteContext } from 'expo-sqlite';
import { addBookmark, removeBookmark } from '../../lib/db/queries';
import { Colors } from '../../constants/colors';
import { ARTICLE_CATEGORIES } from '../../constants/content';
import { Spacing, Radius, Shadow } from '../../constants/theme';
import type { Article, ArticleCategory } from '../../types';

let ARTICLES: Article[] = [];
try {
  ARTICLES = require('../../constants/articles.json') as Article[];
} catch {
  ARTICLES = [];
}

const CATEGORY_COLORS: Record<string, string> = {
  cycle_basics: Colors.dustyRose,
  health_conditions: Colors.error,
  nutrition: Colors.success,
  fitness: Colors.sage,
  mental_health: Colors.gold,
  sexual_health: '#F97316',
  pregnancy: '#EC4899',
  perimenopause: Colors.sageDark,
  ttc: Colors.dustyRoseDark,
};

function ArticleCard({
  article,
  bookmarked,
  onPress,
  onToggleBookmark,
}: {
  article: Article;
  bookmarked: boolean;
  onPress: () => void;
  onToggleBookmark: () => void;
}) {
  const colors = useColors();
  const accentColor = CATEGORY_COLORS[article.category] ?? Colors.dustyRose;
  const catLabel =
    ARTICLE_CATEGORIES.find((c) => c.key === article.category)?.label ?? article.category;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cardWrap}>
      <View
        style={[
          styles.articleCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderLeftColor: accentColor,
          },
          Shadow.sm,
        ]}
      >
        {/* Top row: category badge + bookmark */}
        <View style={styles.articleHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: accentColor + '18' }]}>
            <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
            <Typography
              variant="caption"
              color={accentColor}
              style={{ fontWeight: '700' }}
            >
              {catLabel}
            </Typography>
          </View>
          <TouchableOpacity
            onPress={onToggleBookmark}
            style={[styles.bookmarkBtn, { backgroundColor: bookmarked ? Colors.dustyRose + '15' : 'transparent' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {bookmarked ? (
              <BookmarkCheck size={18} color={Colors.dustyRose} />
            ) : (
              <Bookmark size={18} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Typography
          variant="h4"
          style={{ marginTop: 10, marginBottom: 6, fontWeight: '700', lineHeight: 24 }}
          numberOfLines={2}
        >
          {article.title}
        </Typography>

        {/* Summary */}
        <Typography
          variant="body2"
          color={colors.textSecondary}
          numberOfLines={2}
          style={{ lineHeight: 20 }}
        >
          {article.summary}
        </Typography>

        {/* Footer: reading time + arrow */}
        <View style={styles.articleFooter}>
          <View style={styles.readTime}>
            <Clock size={12} color={colors.textTertiary} />
            <Typography variant="caption" color={colors.textTertiary}>
              {article.readingTimeMinutes} min read
            </Typography>
          </View>
          <ChevronRight size={14} color={colors.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ArticlesScreen() {
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { bookmarks, toggleBookmark } = useCycleStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null);

  const handleToggleBookmark = useCallback(
    async (articleId: string) => {
      if (bookmarks.includes(articleId)) {
        await removeBookmark(db, articleId);
      } else {
        await addBookmark(db, articleId);
      }
      toggleBookmark(articleId);
    },
    [bookmarks, db, toggleBookmark]
  );

  const filtered = useMemo(() => {
    let result = ARTICLES;
    if (selectedCategory) result = result.filter((a) => a.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, selectedCategory]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Article>) => (
      <ArticleCard
        article={item}
        bookmarked={bookmarks.includes(item.id)}
        onPress={() => router.push(`/article/${item.id}`)}
        onToggleBookmark={() => handleToggleBookmark(item.id)}
      />
    ),
    [bookmarks, router, handleToggleBookmark]
  );

  // Shown above the virtualized list when no search/filter is active
  const listHeader = useMemo(() => {
    if (selectedCategory || search.trim()) return null;
    const bookmarkedArticles = ARTICLES.filter((a) => bookmarks.includes(a.id));
    return (
      <>
        {bookmarkedArticles.length > 0 && (
          <View style={styles.section}>
            <Typography
              variant="label"
              color={colors.textSecondary}
              style={{ marginBottom: Spacing.sm, marginHorizontal: Spacing.md, fontWeight: '700' }}
            >
              Bookmarked
            </Typography>
            {bookmarkedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                bookmarked
                onPress={() => router.push(`/article/${article.id}`)}
                onToggleBookmark={() => handleToggleBookmark(article.id)}
              />
            ))}
          </View>
        )}
        <Typography
          variant="label"
          color={colors.textSecondary}
          style={{ marginBottom: Spacing.sm, marginHorizontal: Spacing.md, fontWeight: '700' }}
        >
          All articles · {ARTICLES.length}
        </Typography>
      </>
    );
  }, [selectedCategory, search, bookmarks, colors.textSecondary, router, handleToggleBookmark]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed search + category filter header */}
      <View style={[styles.stickyHeader, { backgroundColor: colors.background }]}>
        <Typography variant="h3" style={{ marginBottom: Spacing.sm, fontWeight: '800' }}>
          Learn
        </Typography>

        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            Shadow.sm,
          ]}
        >
          <Search size={18} color={Colors.dustyRose} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search articles..."
            placeholderTextColor={colors.textTertiary}
            style={{ flex: 1, color: colors.text, fontSize: 15, marginLeft: 10 }}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={[
              styles.catChip,
              {
                backgroundColor: !selectedCategory ? Colors.dustyRose : colors.surface,
                borderColor: !selectedCategory ? Colors.dustyRose : colors.border,
              },
              !selectedCategory ? Shadow.sm : undefined,
            ]}
          >
            <Typography
              variant="caption"
              color={!selectedCategory ? '#fff' : colors.textSecondary}
              style={{ fontWeight: '700' }}
            >
              All
            </Typography>
          </TouchableOpacity>
          {ARTICLE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.key;
            const catColor = CATEGORY_COLORS[cat.key] ?? Colors.dustyRose;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: active ? catColor : colors.surface,
                    borderColor: active ? catColor : colors.border,
                  },
                  active ? Shadow.sm : undefined,
                ]}
              >
                <Typography
                  variant="caption"
                  color={active ? '#fff' : colors.textSecondary}
                  style={{ fontWeight: '700' }}
                >
                  {cat.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            emoji="🔍"
            title="No articles found"
            description="Try a different search or category."
          />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  scroll: { paddingBottom: Spacing['2xl'] },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  catScroll: { marginHorizontal: -Spacing.md },
  catContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    paddingBottom: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  section: { marginBottom: Spacing.sm },
  cardWrap: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  articleCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bookmarkBtn: {
    padding: 6,
    borderRadius: 10,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
