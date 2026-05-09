import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bookmark, BookmarkCheck } from 'lucide-react-native';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/widgets/EmptyState';
import { useColors } from '../../hooks/useTheme';
import { useCycleStore } from '../../stores/cycleStore';
import { useSQLiteContext } from 'expo-sqlite';
import { addBookmark, removeBookmark } from '../../lib/db/queries';
import { Colors } from '../../constants/colors';
import { ARTICLE_CATEGORIES } from '../../constants/content';
import { Spacing, Radius } from '../../constants/theme';
import type { Article, ArticleCategory } from '../../types';

// articles imported — will exist once agent writes the file
let ARTICLES: Article[] = [];
try {
  ARTICLES = require('../../constants/articles.json') as Article[];
} catch {
  ARTICLES = [];
}

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
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card padding={16} style={styles.articleCard}>
        <View style={styles.articleHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: Colors.dustyRose + '22' }]}>
            <Typography variant="caption" color={Colors.dustyRoseDark} style={{ fontWeight: '600' }}>
              {ARTICLE_CATEGORIES.find((c) => c.key === article.category)?.label ?? article.category}
            </Typography>
          </View>
          <TouchableOpacity onPress={onToggleBookmark} style={styles.bookmarkBtn}>
            {bookmarked ? (
              <BookmarkCheck size={20} color={Colors.dustyRose} />
            ) : (
              <Bookmark size={20} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
        <Typography variant="h4" style={{ marginTop: 8, marginBottom: 6 }}>
          {article.title}
        </Typography>
        <Typography variant="body2" color={colors.textSecondary} numberOfLines={2}>
          {article.summary}
        </Typography>
        <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 8 }}>
          {article.readingTimeMinutes} min read
        </Typography>
      </Card>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky header */}
        <View style={[styles.stickyHeader, { backgroundColor: colors.background }]}>
          <Typography variant="h3" style={{ marginBottom: Spacing.sm }}>Learn</Typography>
          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search articles..."
              placeholderTextColor={colors.textTertiary}
              style={{ flex: 1, color: colors.text, fontSize: 15, marginLeft: 8 }}
            />
          </View>
          {/* Category filter */}
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
                  backgroundColor: !selectedCategory ? Colors.dustyRose : colors.surfaceSecondary,
                  borderColor: !selectedCategory ? Colors.dustyRose : colors.border,
                },
              ]}
            >
              <Typography
                variant="caption"
                color={!selectedCategory ? '#fff' : colors.textSecondary}
                style={{ fontWeight: '600' }}
              >
                All
              </Typography>
            </TouchableOpacity>
            {ARTICLE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.key ? Colors.dustyRose : colors.surfaceSecondary,
                    borderColor:
                      selectedCategory === cat.key ? Colors.dustyRose : colors.border,
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  color={selectedCategory === cat.key ? '#fff' : colors.textSecondary}
                  style={{ fontWeight: '600' }}
                >
                  {cat.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bookmarks section */}
        {!selectedCategory && !search && bookmarks.length > 0 && (
          <View style={{ marginBottom: Spacing.sm }}>
            <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 8 }}>
              Bookmarked
            </Typography>
            {ARTICLES.filter((a) => bookmarks.includes(a.id)).map((article) => (
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

        {/* Article list */}
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No articles found"
            description="Try a different search or category."
          />
        ) : (
          filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              bookmarked={bookmarks.includes(article.id)}
              onPress={() => router.push(`/article/${article.id}`)}
              onToggleBookmark={() => handleToggleBookmark(article.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing['2xl'] },
  stickyHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  catScroll: { marginHorizontal: -Spacing.md },
  catContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  articleCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.xl,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  bookmarkBtn: { padding: 4 },
});
