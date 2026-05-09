import React, { useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bookmark, BookmarkCheck } from 'lucide-react-native';

import { Typography } from '../../components/ui/Typography';
import { useColors } from '../../hooks/useTheme';
import { useCycleStore } from '../../stores/cycleStore';
import { useSQLiteContext } from 'expo-sqlite';
import { addBookmark, removeBookmark } from '../../lib/db/queries';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import { ARTICLE_CATEGORIES } from '../../constants/content';
import type { Article } from '../../types';

let ARTICLES: Article[] = [];
try {
  ARTICLES = require('../../constants/articles.json') as Article[];
} catch {
  ARTICLES = [];
}

function renderMarkdown(content: string, colors: ReturnType<typeof useColors>) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(
        <Typography key={key++} variant="h4" style={{ marginTop: 20, marginBottom: 8 }}>
          {line.slice(3)}
        </Typography>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <Typography key={key++} variant="label" style={{ marginTop: 14, marginBottom: 6 }}>
          {line.slice(4)}
        </Typography>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <View key={key++} style={styles.bullet}>
          <View style={[styles.bulletDot, { backgroundColor: Colors.dustyRose }]} />
          <Typography variant="body2" color={colors.textSecondary} style={{ flex: 1 }}>
            {line.slice(2)}
          </Typography>
        </View>
      );
    } else if (line.trim()) {
      elements.push(
        <Typography key={key++} variant="body2" color={colors.textSecondary} style={styles.paragraph}>
          {line}
        </Typography>
      );
    }
  }

  return elements;
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { bookmarks, toggleBookmark } = useCycleStore();

  const article = useMemo(() => ARTICLES.find((a) => a.id === id), [id]);
  const isBookmarked = bookmarks.includes(id);

  const handleToggleBookmark = useCallback(async () => {
    if (isBookmarked) {
      await removeBookmark(db, id);
    } else {
      await addBookmark(db, id);
    }
    toggleBookmark(id);
  }, [isBookmarked, db, id, toggleBookmark]);

  if (!article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Typography variant="body" align="center" style={{ marginTop: 40 }}>
          Article not found.
        </Typography>
      </SafeAreaView>
    );
  }

  const categoryLabel =
    ARTICLE_CATEGORIES.find((c) => c.key === article.category)?.label ?? article.category;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleBookmark} style={styles.bookmarkBtn}>
          {isBookmarked ? (
            <BookmarkCheck size={22} color={Colors.dustyRose} />
          ) : (
            <Bookmark size={22} color={colors.textTertiary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Category badge */}
        <View style={[styles.badge, { backgroundColor: Colors.dustyRose + '22' }]}>
          <Typography variant="caption" color={Colors.dustyRoseDark} style={{ fontWeight: '600' }}>
            {categoryLabel}
          </Typography>
        </View>

        <Typography variant="h2" style={{ marginTop: 12, marginBottom: 8 }}>
          {article.title}
        </Typography>

        <Typography variant="body2" color={colors.textSecondary} style={{ marginBottom: 4 }}>
          {article.summary}
        </Typography>

        <Typography variant="caption" color={colors.textTertiary} style={{ marginBottom: 24 }}>
          {article.readingTimeMinutes} min read
        </Typography>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Content */}
        <View style={styles.content}>
          {renderMarkdown(article.content, colors)}
        </View>

        {/* Tags */}
        {article.tags.length > 0 && (
          <View style={styles.tags}>
            {article.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <Typography variant="caption" color={colors.textTertiary}>
                  #{tag}
                </Typography>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  bookmarkBtn: { padding: 4 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  divider: { height: 1, marginBottom: 20 },
  content: { gap: 4 },
  paragraph: { marginBottom: 8, lineHeight: 22 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
});
