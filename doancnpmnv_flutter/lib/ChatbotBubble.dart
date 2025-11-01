
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class ChatbotBubble extends StatefulWidget {
  const ChatbotBubble({super.key});

  @override
  State<ChatbotBubble> createState() => _ChatbotBubbleState();
}

class _ChatbotBubbleState extends State<ChatbotBubble> {
  bool isOpen = false;
  final TextEditingController _controller = TextEditingController();
  List<Map<String, dynamic>> messages = []; // {'text':..., 'isUser': true/false}
  bool isLoading = false;

  final String openAiKey = "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"; // 🔑 Thay bằng key của bạn

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    setState(() {
      messages.add({'text': text, 'isUser': true});
      isLoading = true;
      _controller.clear();
    });

    try {
      final response = await http.post(
        Uri.parse("https://api.openai.com/v1/chat/completions"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $openAiKey",
        },
        body: jsonEncode({
          "model": "gpt-3.5-turbo",
          "messages": [
            {"role": "user", "content": text}
          ],
          "temperature": 0.7
        }),
      );

      final data = jsonDecode(response.body);
      // ✅ Xử lý an toàn
      String reply = "Lỗi: Không nhận được phản hồi từ server";
      if (data != null &&
          data['choices'] != null &&
          data['choices'] is List &&
          data['choices'].isNotEmpty &&
          data['choices'][0]['message'] != null &&
          data['choices'][0]['message']['content'] != null) {
        reply = data['choices'][0]['message']['content'];
      }

      setState(() {
        messages.add({'text': reply, 'isUser': false});
      });
    } catch (e) {
      setState(() {
        messages.add({'text': "Lỗi kết nối OpenAI: $e", 'isUser': false});
      });
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // 🔹 Nút mở/đóng
        Positioned(
          bottom: 20,
          right: 20,
          child: FloatingActionButton(
            backgroundColor: Colors.yellow,
            foregroundColor: Colors.black,
            onPressed: () {
              setState(() {
                isOpen = !isOpen;
              });
            },
            child: Icon(isOpen ? Icons.close : Icons.chat),
          ),
        ),

        // 🔹 Chat window
        if (isOpen)
          Positioned(
            bottom: 80,
            right: 20,
            left: 20,
            top: 100,
            child: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        reverse: true,
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final msg = messages[messages.length - 1 - index];
                          return Align(
                            alignment: msg['isUser']
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: msg['isUser']
                                    ? Colors.yellow
                                    : Colors.grey[200],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(msg['text']),
                            ),
                          );
                        },
                      ),
                    ),
                    if (isLoading)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 4),
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            decoration: const InputDecoration(
                              hintText: "Nhập tin nhắn...",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.send, color: Colors.black),
                          onPressed: () => sendMessage(_controller.text),
                        )
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
