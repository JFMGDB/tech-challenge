import { useState, useEffect } from 'react';
import { commentService } from '../services/commentService';
import { Comment } from '../types';

export const useComments = (postId: number | null) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [isRealtime, setIsRealtime] = useState<boolean>(false);

  // Realtime effect intentionally not dependent on isRealtime to avoid re-creating SSE
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!postId) return;

    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await commentService.getComments(postId);
        setComments(response.comments);
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Try SSE first
    let es: EventSource | null = null;
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      es = new EventSource(`${base}/comments/stream/${postId}`);

      es.addEventListener('connected', () => setIsRealtime(true));

      es.addEventListener('comment_created', () => {
        // lightweight refresh
        commentService.getComments(postId).then((res) => {
          setComments(res.comments);
          setPagination(res.pagination);
        }).catch(() => {/* ignore transient errors */});
      });

      es.addEventListener('comment_updated', () => {
        commentService.getComments(postId).then((res) => {
          setComments(res.comments);
          setPagination(res.pagination);
        }).catch(() => {/* ignore */});
      });

      es.addEventListener('comment_deleted', () => {
        commentService.getComments(postId).then((res) => {
          setComments(res.comments);
          setPagination(res.pagination);
        }).catch(() => {/* ignore */});
      });

      es.addEventListener('comment_approved', () => {
        commentService.getComments(postId).then((res) => {
          setComments(res.comments);
          setPagination(res.pagination);
        }).catch(() => {/* ignore */});
      });

      es.addEventListener('comment_unapproved', () => {
        commentService.getComments(postId).then((res) => {
          setComments(res.comments);
          setPagination(res.pagination);
        }).catch(() => {/* ignore */});
      });
    } catch (_) {
      // Ignore; fallback to polling below
    }

    // Fallback polling (lightweight) if SSE not established in ~1.5s
    const maybeStartPolling = setTimeout(() => {
      if (!isRealtime) {
        const poll = setInterval(() => {
          if (!postId) return;
          commentService.getComments(postId).then((res) => {
            setComments(res.comments);
            setPagination(res.pagination);
          }).catch(() => {/* ignore */});
        }, 5000);
        // Attach to cleanup via closure
        (window as any).__comments_poll__ = poll;
      }
    }, 1500);

    return () => {
      clearTimeout(maybeStartPolling);
      const poll = (window as any).__comments_poll__;
      if (poll) {
        clearInterval(poll);
        delete (window as any).__comments_poll__;
      }
      if (es) es.close();
      setIsRealtime(false);
    };
  }, [postId]);

  const addComment = async (content: string, parentId?: number) => {
    if (!postId) return;

    try {
      const response = await commentService.createComment({
        content,
        postId,
        parentId,
      });

      // Add the new comment to the list
      if (parentId) {
        // Handle reply logic
        setComments(prev => 
          prev.map(comment => 
            comment.id === parentId 
              ? { 
                  ...comment, 
                  replies: [...(comment.replies || []), response.comment]
                }
              : comment
          )
        );
      } else {
        setComments(prev => [response.comment, ...prev]);
      }

      return response.comment;
    } catch (err: any) {
      throw err;
    }
  };

  const updateComment = async (commentId: number, content: string) => {
    try {
      const response = await commentService.updateComment(commentId, content);
      
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? response.comment
            : {
                ...comment,
                replies: comment.replies?.map(reply => 
                  reply.id === commentId ? response.comment : reply
                ) || []
              }
        )
      );

      return response.comment;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      await commentService.deleteComment(commentId);
      
      setComments(prev => 
        prev.filter(comment => comment.id !== commentId)
             .map(comment => ({
               ...comment,
               replies: comment.replies?.filter(reply => reply.id !== commentId) || []
             }))
      );
    } catch (err: any) {
      throw err;
    }
  };

  const refreshComments = () => {
    if (postId) {
      // Re-fetch comments
    }
  };

  return {
    comments,
    loading,
    error,
    pagination,
    isRealtime,
    addComment,
    updateComment,
    deleteComment,
    refreshComments,
  };
};