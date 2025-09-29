'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { EntryWithTranslations, EntryWithTranslationsAndVotes, Translation, TranslationWithUserVote, UpdateEntryRequest } from "@/app/types";
import { Comment } from "@/app/types/comments";
import Badge from "../ui/badge";
import { formatDate, MdToHtml } from '@/lib/utils';
import { useToast } from '@/lib/context/ToastContext';
import ConfirmationModal from '../ui/confirmation-modal';
import { useAuth } from '@/lib/context/AuthContext';
import { commentsService, entriesService, translationsService } from '@/lib/services';
import type { VoteType } from '@/lib/services/translations';
import EntryEditForm, { EntryUpdateData } from '../forms/entry-edit-form';
import TranslationEditForm, { TranslationUpdateData } from '../forms/translation-edit-form';
import TranslationAddForm, { TranslationCreateData } from '../forms/translation-add-form';
import {
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  PaperAirplaneIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpSolid,
  HandThumbDownIcon as HandThumbDownSolid,
} from '@heroicons/react/24/solid';

interface EntryItemProps {
  entry: EntryWithTranslations | EntryWithTranslationsAndVotes;
  type?: 'entry' | 'translation' | 'comment';
  showDate?: boolean;
  isModal?: boolean; // New prop to indicate modal context
  defaultExpanded?: boolean; // New prop to set initial expanded state
  onEntryUpdate?: (updatedEntry: EntryWithTranslations | EntryWithTranslationsAndVotes) => void;
}

export default function EntryItem({
  entry,
  type = 'entry',
  showDate = true,
  isModal = false,
  defaultExpanded = false,
  onEntryUpdate
}: EntryItemProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAddingTranslation, setIsAddingTranslation] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingTranslationId, setEditingTranslationId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<EntryWithTranslations | EntryWithTranslationsAndVotes>(entry);
  const [userVotes, setUserVotes] = useState<Record<string, VoteType | null>>({});
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});

  const { success, error } = useToast();
  const { user } = useAuth();
  const t = useTranslations();


  // Auto-expand when in modal mode or defaultExpanded is true
  useEffect(() => {
    if (isModal || defaultExpanded) {
      if (!isExpanded) {
        setIsExpanded(true);
      }

      if (isModal) {
        loadExpandedData();
      }
    }
  }, [isModal, defaultExpanded, isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyToClipboard = async (text: string, translationId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(translationId);
      success(
        t('clipboard.copied'),
        t('clipboard.copiedMessage', { text: text }),
        2000
      );
      setTimeout(() => setCopiedId(null), 1000); // Reset visual feedback after 1 second
    } catch (err) {
      console.error('Failed to copy text: ', err);
      error('Copy Failed', 'Unable to copy to clipboard');
    }
  };

  const toggleExpanded = async () => {
    if (!isExpanded) {
      // When expanding for the first time, load both detailed entry and comments
      await loadExpandedData();
    }
    setIsExpanded(!isExpanded);
  };

  const shouldPreventHeaderToggle = (target: EventTarget | null) => {
    return target instanceof HTMLElement && !!target.closest('[data-prevent-toggle="true"]');
  };

  const handleHeaderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (shouldPreventHeaderToggle(event.target)) {
      return;
    }
    void toggleExpanded();
  };

  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (shouldPreventHeaderToggle(event.target)) {
        return;
      }
      event.preventDefault();
      void toggleExpanded();
    }
  };


  const loadExpandedData = async () => {
    setLoadingComments(true);
    try {
      const promises = [];

      // Always fetch comments if we don't have them
      if (comments.length === 0) {
        promises.push(commentsService.getEntryComments(currentEntry.id));
      } else {
        promises.push(Promise.resolve(comments));
      }

      // Fetch detailed entry with votes if we don't have vote data
      if (currentEntry.translations.length > 0 && !('user_vote' in currentEntry.translations[0])) {
        promises.push(entriesService.getEntry(currentEntry.id));
      } else {
        promises.push(Promise.resolve(currentEntry));
      }

      const [commentsResponse, detailedEntry] = await Promise.all(promises);

      // Update comments if they were fetched
      if (comments.length === 0 && Array.isArray(commentsResponse)) {
        setComments(commentsResponse);
      }

      // Update entry and initialize votes if detailed entry was fetched
      if (currentEntry.translations.length > 0 && !('user_vote' in currentEntry.translations[0]) && 'translations' in detailedEntry) {
        const entryWithVotes = detailedEntry as EntryWithTranslationsAndVotes;
        setCurrentEntry(entryWithVotes);
        if (onEntryUpdate) {
          onEntryUpdate(entryWithVotes);
        }

        // Initialize user votes from the detailed entry data
        const initialVotes: Record<string, VoteType | null> = {};
        entryWithVotes.translations.forEach((translation) => {
          if ('user_vote' in translation) {
            const translationWithVote = translation as TranslationWithUserVote;
            initialVotes[translation.id] = translationWithVote.user_vote || null;
          }
        });
        setUserVotes(initialVotes);
      }
    } catch (err) {
      console.error('Failed to load expanded data:', err);
      error(t('entry.error'), t('entry.failedToLoadDetails'));
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || isPostingComment) return;

    setIsPostingComment(true);
    try {
      const newComment = await commentsService.createComment({
        entry_id: currentEntry.id,
        content: commentText.trim(),
      });
      newComment.user = { id: user?.id || '', username: user?.username || 'Unknown' };
      setComments([...comments, newComment]);
      setCommentText('');
      success(t('entry.success'), t('entry.commentPostedSuccessfully'));
    } catch (err) {
      console.error('Failed to post comment:', err);
      error(t('entry.error'), t('entry.failedToPostComment'));
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePostComment();
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) return;

    try {
      const updatedComment = await commentsService.updateComment(commentId, {
        content: editingCommentText.trim(),
      });
      setComments(comments.map(c => c.id === commentId ? { ...updatedComment, user: c.user } : c));
      setEditingCommentId(null);
      setEditingCommentText('');
      success(t('entry.success'), t('entry.commentUpdatedSuccessfully'));
    } catch (err) {
      console.error('Failed to update comment:', err);
      error(t('entry.error'), t('entry.failedToUpdateComment'));
    }
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentConfirm(true);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete) return;

    setIsDeletingComment(true);
    try {
      await commentsService.deleteComment(commentToDelete);
      setComments(comments.filter(c => c.id !== commentToDelete));
      success(t('entry.success'), t('entry.commentDeletedSuccessfully'));

      // Close modal and reset state
      setShowDeleteCommentConfirm(false);
      setCommentToDelete(null);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      error(t('entry.error'), t('entry.failedToDeleteComment'));
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleCancelDeleteComment = () => {
    setShowDeleteCommentConfirm(false);
    setCommentToDelete(null);
    setIsDeletingComment(false);
  };

  const canEdit = (createdBy: string) => {
    return user && (user.role === 'admin' || user.id === createdBy);
  };

  const canAddTranslation = () => {
    return user && user.role !== 'user';
  };

  const canEditComment = (comment: Comment) => {
    return user && (user.role === 'admin' || user.id === comment.user_id);
  };

  const handleEntryUpdate = async (updates: EntryUpdateData) => {
    try {
      // Convert the updates to match API expectations
      const apiUpdates: UpdateEntryRequest = {
        id: currentEntry.id,
        ...Object.fromEntries(
          Object.entries(updates).filter(([, value]) => value !== undefined)
        ),
      };

      await entriesService.updateEntry(apiUpdates);
      // Update local state - only update changed fields
      const newEntry = {
        ...currentEntry,
        ...Object.fromEntries(
          Object.entries(updates).filter(([, value]) => value !== undefined)
        )
      };
      setCurrentEntry(newEntry);
      // Notify parent component if callback is provided
      if (onEntryUpdate) {
        onEntryUpdate(newEntry);
      }
      setEditingEntryId(null);
    } catch (err) {
      console.error('Failed to update entry:', err);
      throw err;
    }
  };

  const handleTranslationUpdate = async (translationId: string, updates: TranslationUpdateData) => {
    try {
      await translationsService.updateTranslation({
        id: translationId,
        ...updates
      });
      // Update local state
      const updatedTranslations = currentEntry.translations.map(t =>
        t.id === translationId ? { ...t, ...updates } : t
      );
      const newEntry = { ...currentEntry, translations: updatedTranslations };
      setCurrentEntry(newEntry);
      // Notify parent component if callback is provided
      if (onEntryUpdate) {
        onEntryUpdate(newEntry);
      }
      setEditingTranslationId(null);
    } catch (err) {
      console.error('Failed to update translation:', err);
      throw err;
    }
  };

  const handleTranslationCreate = async (data: TranslationCreateData) => {
    try {
      const newTranslation = await translationsService.createTranslation(data);
      // Update local state
      const updatedTranslations = [...currentEntry.translations, newTranslation];
      const newEntry = { ...currentEntry, translations: updatedTranslations };
      setCurrentEntry(newEntry);
      // Notify parent component if callback is provided
      if (onEntryUpdate) {
        onEntryUpdate(newEntry);
      }
      setIsAddingTranslation(false);
    } catch (err) {
      console.error('Failed to create translation:', err);
      throw err;
    }
  };

  const handleVote = async (translationId: string, voteType: VoteType) => {
    if (!user) {
      error(t('entry.error'), t('entry.pleaseLoginToVote'));
      return;
    }

    const currentVote = userVotes[translationId];
    const isAlreadyThisVote = currentVote === voteType;
    console.log(`Handling vote: translationId=${translationId}, voteType=${voteType}, currentVote=${currentVote}, isAlreadyThisVote=${isAlreadyThisVote}`);

    // Set voting state
    setVotingStates(prev => ({ ...prev, [translationId]: true }));

    try {
      if (isAlreadyThisVote) {
        // Remove vote if user clicks the same vote again
        await translationsService.removeVote(translationId);
        setUserVotes(prev => {
          const newVotes = { ...prev };
          newVotes[translationId] = null;
          console.log('Vote removed, new votes:', newVotes);
          return newVotes;
        });

        // Update vote counts locally for vote removal
        const updatedTranslations = currentEntry.translations.map(t => {
          if (t.id === translationId) {
            return {
              ...t,
              upvotes: voteType === 'up' ? Math.max(0, t.upvotes - 1) : t.upvotes,
              downvotes: voteType === 'down' ? Math.max(0, t.downvotes - 1) : t.downvotes,
            };
          }
          return t;
        });

        const newEntry = { ...currentEntry, translations: updatedTranslations };
        setCurrentEntry(newEntry);
        if (onEntryUpdate) onEntryUpdate(newEntry);

      } else {
        // Add new vote or switch existing vote
        await translationsService.voteOnTranslation(translationId, voteType);
        setUserVotes(prev => {
          const newVotes = { ...prev };
          newVotes[translationId] = voteType;
          console.log(`Vote ${currentVote ? 'switched' : 'added'}, new votes:`, newVotes);
          return newVotes;
        });

        // Update vote counts locally for vote addition/switching
        const updatedTranslations = currentEntry.translations.map(t => {
          if (t.id === translationId) {
            let newUpvotes = t.upvotes;
            let newDownvotes = t.downvotes;

            if (voteType === 'up') {
              // Adding upvote
              newUpvotes = t.upvotes + 1;
              // If switching from downvote, also reduce downvotes
              if (currentVote === 'down') {
                newDownvotes = Math.max(0, t.downvotes - 1);
              }
            } else {
              // Adding downvote
              newDownvotes = t.downvotes + 1;
              // If switching from upvote, also reduce upvotes
              if (currentVote === 'up') {
                newUpvotes = Math.max(0, t.upvotes - 1);
              }
            }

            return { ...t, upvotes: newUpvotes, downvotes: newDownvotes };
          }
          return t;
        });

        const newEntry = { ...currentEntry, translations: updatedTranslations };
        setCurrentEntry(newEntry);
        if (onEntryUpdate) onEntryUpdate(newEntry);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
      error(t('entry.error'), t('entry.failedToSubmitVote'));
    } finally {
      setVotingStates(prev => ({ ...prev, [translationId]: false }));
    }
  };

  let displayed_translations: (Translation | TranslationWithUserVote)[] = [];
  const length = currentEntry.translations.length;

  if (type === 'translation') {
    const latest_translation = currentEntry.translations.reduce<Translation | TranslationWithUserVote | undefined>((latest, current) => {
      if (!latest) return current;
      return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
    }, undefined);
    displayed_translations = latest_translation ? [latest_translation, ...currentEntry.translations.filter(t => t.id !== latest_translation?.id).slice(0, 4)] : [];
  } else {
    displayed_translations = currentEntry.translations.slice(0, 5);
  }

  const headerToggleProps = !isModal ? {
    role: 'button' as const,
    tabIndex: 0,
    onClick: handleHeaderClick,
    onKeyDown: handleHeaderKeyDown,
    'aria-expanded': isExpanded,
  } : {};

  return (
    <div
      key={currentEntry.id}
      className={`${isModal ? 'bg-transparent border-0 shadow-none' : 'bg-white border border-gray-300 hover:rounded-lg transition-all duration-150 hover:shadow-sm'}`}
    >
      {/* Header - Always visible */}
      <div
        className={`px-2 py-1.5 ${!isModal ? 'group cursor-pointer duration-150' : ''}`}
        {...headerToggleProps}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {/* Primary name with serif font for elegance */}
            <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
              <h3 className="font-serif font-bold text-gray-900 text-base leading-tight">
                {currentEntry.primary_name}
              </h3>
              {currentEntry.original_script && (
                <span className="font-serif italic text-gray-700 text-sm">
                  {currentEntry.original_script}
                </span>
              )}
              <Badge code={currentEntry.language_code} />
              {currentEntry.entry_type && <Badge code={currentEntry.entry_type} type="type" />}
            </div>

            {/* Alternative names in compact form */}
            {currentEntry.alternative_names && currentEntry.alternative_names.length > 0 && (
              <div className="text-gray-600 text-xs mb-1 font-medium">
                {t('entry.aka')}: {currentEntry.alternative_names.join(' • ')}
              </div>
            )}

            {/* Definition with serif for readability */}
            {currentEntry.etymology && (
              <p className="text-gray-800 text-sm font-serif leading-snug mb-1.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: MdToHtml(currentEntry.etymology) }}>
              </p>
            )}

            {currentEntry.definition && (
              <p className="text-gray-800 text-sm font-serif leading-snug mb-1.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: MdToHtml(currentEntry.definition) }}>
              </p>
            )}

            {currentEntry.historical_context && (
              <p className="text-gray-800 text-sm font-serif leading-snug mb-1.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: MdToHtml(currentEntry.historical_context) }}>
              </p>
            )}

            {/* Compact translation preview - flowing inline text */}
            {!isExpanded && displayed_translations.length > 0 && (
              <div className="text-xs leading-relaxed">
                {displayed_translations.slice(0, 4).map((translation, index) => (
                  <span key={translation.id}>
                    {index > 0 && <span className="text-gray-400"> • </span>}
                    <span
                      data-prevent-toggle="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        void copyToClipboard(translation.translated_name, translation.id);
                      }}
                      className={`p-1 rounded font-medium cursor-pointer transition-all duration-150 ${copiedId === translation.id
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      title={t('entry.clickToCopy')}
                    >
                      {translation.translated_name}
                    </span>
                    {translation.notes && (
                      <span className="text-gray-600 font-serif" >
                        :{' '}{translation.notes.length > 150 ? translation.notes.substring(0, 150) + '...' : translation.notes}
                      </span>
                    )}
                  </span>
                ))}
                {length > 4 && <span className="text-gray-500"> {t('entry.andMore', { count: length - 4 })}</span>}
              </div>
            )}
          </div>

          {/* Compact controls */}
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            {showDate && (
              <time className="text-xs text-gray-500 font-mono">
                {formatDate(currentEntry.updated_at)}
              </time>
            )}
            {!isModal && (
              <button
                data-prevent-toggle="true"
                onClick={(event) => {
                  event.stopPropagation();
                  void toggleExpanded();
                }}
                disabled={loadingComments}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 group-hover:text-gray-700 group-hover:bg-gray-100 rounded transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-default"
                title={isExpanded ? t('entry.collapse') : t('entry.expand')}
              >
                {loadingComments ? (
                  <div className="animate-spin h-4 w-4 border border-gray-500 border-t-transparent rounded-full"></div>
                ) : (
                  <div className={`transform transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                    <ChevronDownIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 hover:scale-110" />
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
        <div className="border-t border-gray-200">
          {/* Compact action buttons */}
          {(canEdit(currentEntry.created_by) || canAddTranslation()) && (
            <div className="px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex gap-2">
              {canEdit(currentEntry.created_by) && (
                <button
                  onClick={() => setEditingEntryId(currentEntry.id)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors rounded"
                >
                  <PencilIcon className="h-3 w-3 mr-1" />
                  {t('entry.edit')}
                </button>
              )}
              {canAddTranslation() && (
                <button
                  onClick={() => setIsAddingTranslation(!isAddingTranslation)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors rounded"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  {t('entry.add')}
                </button>
              )}
            </div>
          )}

          {/* All translations - dense layout */}
          <div className="px-2 py-1.5">
            <h4 className="font-sans font-semibold text-gray-900 text-sm mb-2">
              {t('entry.translations', { count: currentEntry.translations.length })}
            </h4>

            {/* Translation list - compact grid */}
            <div className="space-y-1.5">
              {currentEntry.translations.map((translation) => (
                <div key={translation.id} className="border border-gray-200 rounded bg-gray-25 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between p-2">
                    <div className="flex-1 min-w-0">
                      {/* Translation name with serif for elegance */}
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-serif font-medium text-gray-900 text-sm">
                          {translation.translated_name}
                        </span>
                        {translation.is_preferred && (
                          <span className="px-1.5 py-0.5 text-xs font-medium text-amber-800 bg-amber-200 rounded">
                            ★
                          </span>
                        )}
                      </div>

                      {translation.notes && (
                        <p className="text-gray-600 text-xs font-serif mb-1 line-clamp-2">
                          {translation.notes}
                        </p>
                      )}

                      {/* Compact metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                        <span>{formatDate(translation.created_at)}</span>
                        {translation.updated_at !== translation.created_at && (
                          <span>• {t('entry.edited')} {formatDate(translation.updated_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Compact voting and actions */}
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleVote(translation.id, 'up')}
                          disabled={votingStates[translation.id] || !user}
                          className={`p-1 rounded transition-colors ${userVotes[translation.id] === 'up'
                            ? 'text-green-700 bg-green-200 hover:bg-green-300'
                            : 'text-green-600 hover:bg-green-100'
                            } disabled:opacity-50 disabled:cursor-default cursor-pointer`}
                          title={user ? (userVotes[translation.id] === 'up' ? t('entry.removeUpvote') : t('entry.upvote')) : t('entry.loginToVote')}
                        >
                          {votingStates[translation.id] ? (
                            <div className="animate-spin h-3 w-3 border border-green-600 border-t-transparent rounded-full"></div>
                          ) : userVotes[translation.id] === 'up' ? (
                            <HandThumbUpSolid className="h-3 w-3" />
                          ) : (
                            <HandThumbUpIcon className="h-3 w-3" />
                          )}
                        </button>
                        <span className="text-xs text-green-600 font-medium min-w-[1rem] text-center">
                          {translation.upvotes}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleVote(translation.id, 'down')}
                          disabled={votingStates[translation.id] || !user}
                          className={`p-1 rounded transition-colors ${userVotes[translation.id] === 'down'
                            ? 'text-red-700 bg-red-200 hover:bg-red-300'
                            : 'text-red-600 hover:bg-red-100'
                            } disabled:opacity-50 disabled:cursor-default cursor-pointer`}
                          title={user ? (userVotes[translation.id] === 'down' ? t('entry.removeDownvote') : t('entry.downvote')) : t('entry.loginToVote')}
                        >
                          {votingStates[translation.id] ? (
                            <div className="animate-spin h-3 w-3 border border-red-600 border-t-transparent rounded-full"></div>
                          ) : userVotes[translation.id] === 'down' ? (
                            <HandThumbDownSolid className="h-3 w-3" />
                          ) : (
                            <HandThumbDownIcon className="h-3 w-3" />
                          )}
                        </button>
                        <span className="text-xs text-red-600 font-medium min-w-[1rem] text-center">
                          {translation.downvotes}
                        </span>
                      </div>

                      {canEdit(translation.created_by) && (
                        <button
                          onClick={() => setEditingTranslationId(translation.id)}
                          className="p-0.5 text-amber-600 hover:bg-amber-100 rounded transition-colors ml-1"
                          title={t('entry.edit')}
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments section - compact */}
          <div className="px-2 py-1.5 border-t border-gray-200">
            <h4 className="font-sans font-semibold text-gray-900 text-sm mb-2">
              {t('entry.comments', { count: comments.length })}
            </h4>

            {/* Compact comment input */}
            {user && (
              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('entry.addCommentPlaceholder')}
                  className="text-xs w-full px-2 py-1.5 pr-8 border border-gray-300 rounded resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 font-serif"
                  rows={2}
                  disabled={isPostingComment}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!commentText.trim() || isPostingComment}
                  className={`absolute right-1 top-1 p-1 rounded transition-colors ${!commentText.trim() || isPostingComment
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}
                  title={t('entry.post')}
                >
                  {isPostingComment ? (
                    <div className="animate-spin h-3 w-3 border border-gray-300 border-t-green-600 rounded-full"></div>
                  ) : (
                    <PaperAirplaneIcon className="h-3 w-3" />
                  )}
                </button>
              </div>
            )}

            {/* Compact comments list - inline flow */}
            {loadingComments ? (
              <div className="text-center py-2 text-gray-500 text-xs">{t('entry.loading')}</div>
            ) : comments.length > 0 ? (
              <div className="space-y-1.5">
                {comments.map((comment) => (
                  <div key={comment.id} className="border border-gray-200 rounded bg-gray-25 p-2">
                    {editingCommentId === comment.id ? (
                      // Edit mode
                      <div className="space-y-2">
                        <div className="text-xs font-sans font-medium text-amber-700 mb-1">
                          {comment.user.username} ({t('entry.editing')}):
                        </div>
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="text-xs w-full px-2 py-1.5 border border-gray-300 rounded resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 font-serif"
                          rows={3}
                          placeholder={t('entry.editCommentPlaceholder')}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveCommentEdit(comment.id)}
                            disabled={!editingCommentText.trim()}
                            className="px-2 py-1 text-xs bg-lime-600 text-white rounded hover:bg-lime-700 disabled:opacity-50 disabled:cursor-default"
                          >
                            {t('entry.save')}
                          </button>
                          <button
                            onClick={handleCancelCommentEdit}
                            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            {t('entry.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="text-xs leading-relaxed mb-1 flex-1">
                            <span className="font-sans font-medium text-amber-700">
                              {comment.user.username}:
                            </span>
                            <span className="font-serif text-gray-800 ml-1" dangerouslySetInnerHTML={{ __html: MdToHtml(comment.content) }} />
                          </div>
                          {canEditComment(comment) && (
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="p-0.5 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                                title={t('entry.editComment')}
                              >
                                <PencilIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-0.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title={t('entry.deleteComment')}
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {formatDate(comment.created_at)}
                          {comment.is_edited && <span className="ml-2 italic">({t('entry.edited')})</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-gray-500 text-xs">{t('entry.noComments')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Forms */}
      {editingEntryId === currentEntry.id && (
        <EntryEditForm
          entry={currentEntry}
          onSave={handleEntryUpdate}
          onCancel={() => setEditingEntryId(null)}
        />
      )}
      {editingTranslationId && (
        <TranslationEditForm
          translation={currentEntry.translations.find(t => t.id === editingTranslationId)!}
          onSave={(updates) => handleTranslationUpdate(editingTranslationId, updates)}
          onCancel={() => setEditingTranslationId(null)}
        />
      )}
      {isAddingTranslation && (
        <TranslationAddForm
          entryId={currentEntry.id}
          entryName={currentEntry.primary_name}
          onSave={handleTranslationCreate}
          onCancel={() => setIsAddingTranslation(false)}
        />
      )}

      {/* Delete Comment Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteCommentConfirm}
        onClose={handleCancelDeleteComment}
        onConfirm={handleConfirmDeleteComment}
        title={t('entry.deleteComment')}
        message={t('entry.deleteCommentConfirmation')}
        confirmText={t('entry.deleteComment')}
        cancelText={t('entry.cancel')}
        type="danger"
        isLoading={isDeletingComment}
      />
    </div>
  );
}
