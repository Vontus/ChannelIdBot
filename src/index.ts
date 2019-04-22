import * as TelegramBot from 'node-telegram-bot-api'
import util from './util'
import formatter from './formatter'
import logger from './logger';

const APOSTROPHE_CHAR = "'"

const botToken: string = util.getRequiredEnvVar('BOT_TOKEN')
const botUsername: string = util.getRequiredEnvVar('BOT_USERNAME')

const bot = new TelegramBot(botToken, { polling: true })

bot.on('message', onMessage)
bot.on('channel_post', onMessage)
bot.on('inline_query', onInlineQuery)

async function onMessage(message: TelegramBot.Message) {
  if (message.chat.type === 'private' && message.from) {
    logger.info(message.from.id, 'private')
    if (message.forward_from) {
      await sendPrivateDescription(message.chat, message.forward_from)
      sendId(message.chat, message.forward_from)
    } else if (message.forward_from_chat) {
      await sendChatDescription(message.chat, message.forward_from_chat)
      sendId(message.chat, message.forward_from_chat)
    } else {
      await sendPrivateDescription(message.chat, message.from)
      sendId(message.chat, message.from)
    }
  } else if (!message.left_chat_member || message.left_chat_member.username !== botUsername) {
    logger.info(message.chat.id, 'chat')
    try {
      // Can fail if the bot doesn't have permission to send messages
      await sendChatDescription(message.chat, message.chat)
      await sendId(message.chat, message.chat)
    } finally {
      // We leave the chat anyways
      bot.leaveChat(message.chat.id)
    }
  }
}

async function onInlineQuery(inlineQuery: TelegramBot.InlineQuery) {
  logger.info(inlineQuery.from.id, 'Inline query')
  bot.answerInlineQuery(inlineQuery.id, getInlineAnswer(inlineQuery.from))
}

function getInlineAnswer(forUser: TelegramBot.User): TelegramBot.InlineQueryResultArticle[] {
  return [{
    type: 'article',
    id: forUser.id + '_1',
    title: 'Send your ID only',
    description: `"${forUser.id.toString()}"`,
    input_message_content: {
      message_text: formatter.code(forUser.id.toString()),
      parse_mode: 'HTML'
    }
  }, {
    type: 'article',
    id: forUser.id + '_2',
    title: 'Send ID + description',
    description: `"My ID: ${forUser.id.toString()}"`,
    input_message_content: {
      message_text: `My ID: ${formatter.code(forUser.id.toString())}`,
      parse_mode: 'HTML'
    }
  }]
}

function sendChatDescription(toChat: TelegramBot.Chat, ofChat: TelegramBot.Chat) {
  return bot.sendMessage(toChat.id, ofChat.type.charAt(0).toUpperCase() + ofChat.type.slice(1) + ' ID:')
}

function sendPrivateDescription(toChat: TelegramBot.Chat, ofUser: TelegramBot.User) {
  if (ofUser.is_bot) {
    return bot.sendMessage(toChat.id, 'Bot ID:')
  } else if (toChat.id === ofUser.id) {
    return bot.sendMessage(toChat.id, 'Your ID:')
  } else {
    return bot.sendMessage(toChat.id, 'User ID:')
  }
}

function sendId(toChat: TelegramBot.Chat, hasId: IHasId) {
  return bot.sendMessage(toChat.id, formatter.code(hasId.id.toString()), { parse_mode: 'HTML' })
}

function possessive(txt: string): string {
  if (txt == '') {
    return txt;
  }
  var lastChar = txt.slice(-1);
  var endOfWord = lastChar.toLowerCase() == 's' ? APOSTROPHE_CHAR : `${APOSTROPHE_CHAR}s`;
  return `${txt}${endOfWord}`;
}

interface IHasId {
  id: number | string
}
