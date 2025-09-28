import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Heading, Text } from '../../components/ui';
import { usePost } from '../../hooks/usePosts';
import MarkdownRenderer from '../../components/MarkdownRenderer';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams();
  const numericId = id ? parseInt(id, 10) : null;
  const { post, loading, error } = usePost(numericId || 0);

  if (!numericId) return <Container><Text color="red.600">Invalid post id</Text></Container>;
  if (loading) return <Container><Text>Loading...</Text></Container>;
  if (error || !post) return <Container><Text color="red.600">Post not found</Text></Container>;

  return (
    <Container>
      <Heading as="h1" mb={4}>{post.title}</Heading>
      {post.imageUrl && (
        <Box mb={4}>
          <img src={post.imageUrl} alt={post.title} loading="lazy" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </Box>
      )}
      <MarkdownRenderer content={post.content || ''} />
    </Container>
  );
};

export default PostDetailPage;


