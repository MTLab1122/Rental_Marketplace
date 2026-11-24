import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/models/conversation_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../application/providers/chat_provider.dart';
import '../../application/providers/messages_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final ConversationModel conversation;

  const ChatScreen({super.key, required this.conversation});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 60,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _handleSend() async {
    final text = _textController.text;
    if (text.trim().isEmpty) return;

    _textController.clear();
    final success = await ref
        .read(chatProviderFamily(widget.conversation.id).notifier)
        .sendMessage(text);

    if (success) {
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    }
  }

  void _showReportDialog(BuildContext context) {
    String selectedReason = 'HARASSMENT';
    final detailsController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Report Conversation',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Select reason:',
                        style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: selectedReason,
                      isExpanded: true,
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(), isDense: true),
                      items: const [
                        DropdownMenuItem(
                            value: 'HARASSMENT',
                            child:
                                Text('Harassment or Inappropriate Behavior')),
                        DropdownMenuItem(
                            value: 'DISCRIMINATION',
                            child: Text('Discrimination or Bias')),
                        DropdownMenuItem(
                            value: 'FAKE_LISTING',
                            child: Text('Fake Listing or Advance Scam')),
                        DropdownMenuItem(
                            value: 'MISLEADING_INFORMATION',
                            child: Text('Misleading Rental Terms')),
                        DropdownMenuItem(
                            value: 'OTHER',
                            child: Text('Other Safety Concern')),
                      ],
                      onChanged: (val) {
                        if (val != null)
                          setDialogState(() => selectedReason = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    const Text('Incident Details:',
                        style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: detailsController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: 'Describe what occurred...',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                      foregroundColor: Colors.white),
                  onPressed: () async {
                    final details = detailsController.text.trim();
                    if (details.isEmpty) return;
                    Navigator.pop(dialogContext);

                    final ok = await ref
                        .read(messagesProvider.notifier)
                        .reportConversation(
                          conversationId: widget.conversation.id,
                          reason: selectedReason,
                          details: details,
                        );

                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(ok
                              ? 'Safety report submitted to Peshawar moderation.'
                              : 'Could not submit report.'),
                        ),
                      );
                    }
                  },
                  child: const Text('Submit Report'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showBlockDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Block Conversation?'),
        content: const Text(
          'Neither participant will be able to send further messages. You can report violations to the Peshawar moderation team.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(dialogContext);
              final ok = await ref
                  .read(messagesProvider.notifier)
                  .blockConversation(widget.conversation.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                      content: Text(
                          ok ? 'Conversation blocked.' : 'Failed to block.')),
                );
              }
            },
            child: const Text('Block'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProviderFamily(widget.conversation.id));
    final authState = ref.watch(authProvider);
    final currentUserId = authState.user?.id;
    final otherName =
        widget.conversation.getOtherParticipantName(currentUserId ?? '');

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(otherName,
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            if (widget.conversation.propertyTitle != null)
              Text(
                widget.conversation.propertyTitle!,
                style: const TextStyle(fontSize: 11, color: Colors.white70),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
        actions: [
          if (widget.conversation.canContactWhatsapp &&
              widget.conversation.whatsappUrl != null)
            IconButton(
              tooltip: 'Chat on WhatsApp',
              icon: const Icon(Icons.chat, color: Colors.lightGreenAccent),
              onPressed: () async {
                final uri = Uri.parse(widget.conversation.whatsappUrl!);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              },
            ),
          PopupMenuButton<String>(
            onSelected: (val) {
              if (val == 'report') {
                _showReportDialog(context);
              } else if (val == 'block') {
                _showBlockDialog(context);
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'report',
                child: Row(
                  children: [
                    Icon(Icons.flag_outlined,
                        size: 18, color: Colors.redAccent),
                    SizedBox(width: 8),
                    Text('Report safety issue'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'block',
                child: Row(
                  children: [
                    Icon(Icons.block, size: 18, color: Colors.grey),
                    SizedBox(width: 8),
                    Text('Block user'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          if (widget.conversation.isBlocked)
            Container(
              width: double.infinity,
              color: Colors.red.shade50,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.block, size: 16, color: Colors.red.shade700),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'This conversation is blocked. No further messages can be sent.',
                      style: TextStyle(
                          fontSize: 11,
                          color: Colors.red.shade800,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: chatState.isLoading
                ? const Center(child: CircularProgressIndicator())
                : chatState.messages.isEmpty
                    ? Center(
                        child: Text(
                          'No messages yet. Send a greeting to start chatting!',
                          style: TextStyle(
                              fontSize: 13, color: Colors.grey.shade500),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: chatState.messages.length,
                        itemBuilder: (context, index) {
                          final msg = chatState.messages[index];
                          final isMe = msg.senderId == currentUserId;
                          final timeStr =
                              DateFormat('hh:mm a').format(msg.createdAt);

                          return Align(
                            alignment: isMe
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              constraints: BoxConstraints(
                                maxWidth:
                                    MediaQuery.of(context).size.width * 0.78,
                              ),
                              decoration: BoxDecoration(
                                color: isMe
                                    ? AppTheme.primaryEmerald
                                    : Colors.white,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(14),
                                  topRight: const Radius.circular(14),
                                  bottomLeft: isMe
                                      ? const Radius.circular(14)
                                      : Radius.zero,
                                  bottomRight: isMe
                                      ? Radius.zero
                                      : const Radius.circular(14),
                                ),
                                border: isMe
                                    ? null
                                    : Border.all(color: Colors.grey.shade200),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.04),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: isMe
                                    ? CrossAxisAlignment.end
                                    : CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    msg.content,
                                    style: TextStyle(
                                      color:
                                          isMe ? Colors.white : Colors.black87,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        timeStr,
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isMe
                                              ? Colors.white70
                                              : Colors.grey.shade500,
                                        ),
                                      ),
                                      if (isMe) ...[
                                        const SizedBox(width: 4),
                                        Icon(
                                          msg.isRead
                                              ? Icons.done_all
                                              : Icons.done,
                                          size: 13,
                                          color: msg.isRead
                                              ? Colors.lightGreenAccent
                                              : Colors.white70,
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          if (chatState.isOtherTyping)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '$otherName is typing...',
                  style: TextStyle(
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                      color: Colors.grey.shade600),
                ),
              ),
            ),
          SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      enabled: !widget.conversation.isBlocked,
                      decoration: InputDecoration(
                        hintText: widget.conversation.isBlocked
                            ? 'Conversation blocked'
                            : 'Type your message...',
                        hintStyle: TextStyle(
                            fontSize: 13, color: Colors.grey.shade400),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        isDense: true,
                      ),
                      onChanged: (_) {
                        ref
                            .read(chatProviderFamily(widget.conversation.id)
                                .notifier)
                            .onUserTyping();
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: widget.conversation.isBlocked
                        ? Colors.grey.shade300
                        : AppTheme.primaryEmerald,
                    radius: 20,
                    child: IconButton(
                      icon:
                          const Icon(Icons.send, size: 18, color: Colors.white),
                      onPressed:
                          widget.conversation.isBlocked ? null : _handleSend,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
