import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Box, Heading, Text, Flex, Button } from '../../components/ui';
import { usePosts } from '../../hooks/usePosts';
import MarkdownRenderer from '../../components/MarkdownRenderer';

export const HomePage: React.FC = () => {
  const { posts, loading, error } = usePosts();

  if (loading) return <Container><Text>Loading...</Text></Container>;
  if (error) return <Container><Text color="red.600">{error}</Text></Container>;

  return (
    <Container>
      <Heading as="h1" mb={6}>Latest Posts</Heading>
      <Flex style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {posts.map(post => (
          <Box key={post.id} border="1px solid" borderColor="gray.200" borderRadius="md" p={4} bg="white">
            <Heading as="h2" mb={2}>{post.title}</Heading>
            {post.excerpt ? (
              <Text color="gray.700">{post.excerpt}</Text>
            ) : (
              <MarkdownRenderer content={(post.content || '').slice(0, 400) + '...'} />
            )}
            <Box mt={3}>
              <Button as={Link as any} to={`/post/${post.id}`} size="sm" variant="outline">Read more</Button>
            </Box>
          </Box>
        ))}
      </Flex>
    </Container>
  );
};

export default HomePage;


