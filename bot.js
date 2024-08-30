sconst https = require('https');
setInterval(() => {
  https.get('https://hamster-bot-1.onrender.com/'); // Замените на URL вашего сервера
}, 300000);
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = '7223470896:AAELTVjZbT1psC3ysOCOXwI3KmEhjdM0N2I';  // Ваш токен
const bot = new TelegramBot(token, { polling: true });

const app = express();
const port = process.env.PORT || 3000;

var butt
// Сохранение ID сообщений для удаления и закрепления
const messagesCache = {};
const pinnedMessages = {}; // Добавляем объект для отслеживания закрепленных сообщений

bot.setMyCommands([
    { command: 'start', description: 'Start the bot' }
]);

// Функция для удаления старого сообщения
async function deleteMessageIfExists(chatId, messageId) {
    if (messageId) {
        try {
            await bot.deleteMessage(chatId, messageId);
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    }
}

// Функция для закрепления сообщения, если оно еще не закреплено
async function pinMessageIfNotPinned(chatId, messageId, text) {
    if (pinnedMessages[chatId] !== messageId) {
        try {
            // Получаем информацию о закрепленном сообщении
            const chat = await bot.getChat(chatId);
            const pinnedMessage = chat.pinned_message;

            if (pinnedMessage && pinnedMessage.text !== text) {
                await bot.unpinChatMessage(chatId);
            }

            // Закрепляем новое сообщение
            await bot.pinChatMessage(chatId, messageId);
            pinnedMessages[chatId] = messageId;
        } catch (error) {
            console.error('Failed to pin message:', error);
        }
    }
}

// Обрабатываем команду /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    if(butt!==undefined){bot.deleteMessage(chatId,butt.message_id)}
    // Удаляем кнопку "Start Over", если она существует
    if (messagesCache[chatId] && messagesCache[chatId].startOverMessageId) {
        await deleteMessageIfExists(chatId, messagesCache[chatId].startOverMessageId);
    }

    // Отправляем начальное сообщение
    const initialMessage = await bot.sendMessage(chatId, "<b>✴️What you can buy here:</b>", { parse_mode: 'HTML' });
    
    // Закрепляем начальное сообщение, если оно еще не закреплено
    await pinMessageIfNotPinned(chatId, initialMessage.message_id, "<b>✴️What you can buy here:</b>");
    
    // Отправляем сообщение о загрузке
    const loadingMessage = await bot.sendMessage(chatId, 'Loading...');
    
    // Удаляем сообщение о загрузке через 2 секунды
    setTimeout(async () => {
        await bot.deleteMessage(chatId, loadingMessage.message_id);

        // Отправляем сообщение с анимацией и кнопкой "Next"
        const animationMessage = await bot.sendPhoto(
            chatId,
            'https://cdn-icons-png.flaticon.com/256/6553/6553990.png',
            {
                caption: '*🔑 Keys from Hamster games 👾*\n\n> All keys for 1 day \\= 0\\.5$\n\n `\\*Can be ordered for a week, \n for 3 days, etc.`',
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Next 1/4', callback_data: 'show_referrals' }]
                    ]
                }
            }
        );

        // Сохраняем ID сообщения для дальнейшего удаления
        messagesCache[chatId] = {
            animationMessageId: animationMessage.message_id
        };
    }, 2000);
});

// Обработка нажатий на инлайн-кнопки
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const callbackData = query.data;

    // Удаляем предыдущее сообщение, если оно существует
    if (messagesCache[chatId]) {
        await deleteMessageIfExists(chatId, messagesCache[chatId].animationMessageId);
    }

    if (callbackData === 'show_referrals') {
        // Отправка сообщения с фото и текстом и кнопкой "Next" для альбома
        const photoMessage = await bot.sendPhoto(
            chatId,
            'https://www.iguides.ru/upload/iblock/32e/k1upzu7h4lxad3hp38ks71vn095p2zwq.png',
            {
                caption: '*👥 Referrals💰*\n\n _Hamster🐹, DOGS🦴, Blum⚫️, Catizen😺, *whatever*_\n\n> 1 referral \\= 0\\.5$',
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Next 2/4', callback_data: 'show_album' }]
                    ]
                }
            }
        );
        if (!messagesCache[chatId]) {
            messagesCache[chatId] = {};
        }
        messagesCache[chatId].animationMessageId = photoMessage.message_id;
    } else if (callbackData === 'show_album') {
        // Отправка альбома с фотографиями
        const photos = [
            { type: 'photo', media: 'https://i.imgur.com/M4TKDUN.png', caption: '<b>🐹 Hamster Kombat Desktop App with Autoclicker 🕹</b>\n\n<i>MACOSX/Windows app with a built-in <b>clicker</b> in Hamster</i>\n\n<code>A telegram app where you can open Hamster on Desktop with clicker</code>\n\n<blockquote>Mac/Windows app file = 3.5$</blockquote>', parse_mode: 'HTML'},
            { type: 'photo', media: 'https://i.imgur.com/RPdbIgT.png' },
            { type: 'photo', media: 'https://i.imgur.com/r3i0xXb.png' }
        ];

        const albumMessages = await bot.sendMediaGroup(chatId, photos);

        // Отправляем GIF-анимацию и кнопку "Next" для следующего альбома
        const gifMessage = await bot.sendAnimation(
            chatId,
            'https://i.imgur.com/nLDjuCq.gif',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Next 3/4', callback_data: 'show_last_photo' }]
                    ]
                }
            }
        );

        // Сохраняем ID сообщений для дальнейшего удаления
        messagesCache[chatId] = {
            albumMessages: albumMessages.map(msg => msg.message_id),
            gifMessageId: gifMessage.message_id
        };
    } else if (callbackData === 'show_last_photo') {
        // Удаляем предыдущие сообщения (альбом и GIF)
        if (messagesCache[chatId].albumMessages) {
            for (const messageId of messagesCache[chatId].albumMessages) {
                await deleteMessageIfExists(chatId, messageId);
            }
        }
        await deleteMessageIfExists(chatId, messagesCache[chatId].gifMessageId);

        // Отправка последнего фото с текстом и кнопкой "Start Over"
        const photos = [
            { type: 'photo', media: 'https://i.imgur.com/0iVia3U.png', caption: '<b>🐹 Hamster Kombat Bot 🃏</b>\n\n<i>You can see at the photos what bot can do 🎚\nBy default it can do <b>taps, boost & streak 24/7 ⌛️</b></i>\n\n<code>︎※ - I will give all the instructions and information until you can launch the bot. But you will need your Win/Mac and a code editor like Visual Studio. The bot will work as long as your code editor is turned on\n\n⚿ - I will do everything by myself and I will launch the bot on cloud storage so the bot will work 24/7</code>\n\n<blockquote>※ = 3$</blockquote>\n<blockquote>⚿ = 5$</blockquote><blockquote>1 active ref = 2$ per month⏳</blockquote>\n\n<b>Actual for other cryptogames, choose yourself🌀</b>', parse_mode: 'HTML'},
            { type: 'photo', media: 'https://i.imgur.com/LWWMaXr.png' },
            { type: 'photo', media: 'https://i.imgur.com/bCSYbdX.png' }
        ];

        const albumMessages = await bot.sendMediaGroup(chatId, photos);

        // Отправляем неинлайн-кнопку "Start Over"
        const startOverMessage = await bot.sendMessage(
            chatId,
            '<b>4/4</b>\n<blockquote>Press button below to see more info</blockquote>',
            {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        [{ text: 'Buy🪙+' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );

        // Сохраняем ID сообщений для дальнейшего удаления
        messagesCache[chatId] = {
            albumMessages: albumMessages.map(msg => msg.message_id),
            startOverMessageId: startOverMessage.message_id
        };
    }else if (callbackData === 'visa') {
        // Отправка сообщения с фото и текстом и кнопкой "Next" для альбома
        const photoMessage = await bot.sendAnimation(
            chatId,
            'https://media.tenor.com/kUtxXnZmGvUAAAAM/bnb-wikimadao.gif',
            {
                caption: '<b>✴️ Cryptocurrency ₿+ 📴</b>\n\n<blockquote>The best method</blockquote>\n\n<blockquote>You can send any crypto</blockquote>\n\n<blockquote>Low commissions</blockquote>',
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Next 2/3', callback_data: 'crypto' }]
                    ]
                }
            }
        );
        messagesCache[chatId].animationMessageId = photoMessage.message_id;
    }else if (callbackData === 'crypto') {
        // Отправка сообщения с фото и текстом и кнопкой "Next" для альбома
        const photoMessage = await bot.sendPhoto(
            chatId,
            'https://cdn4.cdn-telegram.org/file/UPhkPWq5DcLmwZEysYh1uTvMkcRTERXB6V-K0pL-__YpIV3YFBIN5oQ3Ehq7pjrcjv2OlxQlkjySqtK748ZzVLN_TOzrC0kePtATD7rs0h_5ha3hhlbDqNVWUULWpUtW8sTLrhdpNiKrtU7jfqXPDGJ4ewqCFu3B4fJSHYoaI9AZz6aCfA4VYdLd8E0uPNc0Fe6LHVq_zi1u2JRZM6QOuxzL0LxoHhiFYXkdQKbXZVlRkPjfDMjhFFOFx1fZXggYOgKoxCExvRjg3JGxgnkKjv6jEviVi6EmLG7wtv9umhLxZ64NCKRQUQ6MvehDsmmOurtdb0WKnv6DLuv5DuB9Bg.jpg',
            {
                caption: '<b>🔷 Telegram Wallet 🈂️</b>\n\n<blockquote>If you want to use Telegram stuff</blockquote>\n\n<blockquote>You can make a payment\nwithout leaving app</blockquote>',
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Next 3/3', callback_data: 'wallet' }]
                    ]
                }
            }
        );
        messagesCache[chatId].animationMessageId = photoMessage.message_id;
    }else if(callbackData === 'wallet'){    
        const textic = await bot.sendMessage(chatId,'<blockquote>Reviews - https://t.me/hamster_friends_reviews</blockquote>',{parse_mode:'HTML'})

        butt = await bot.sendMessage(chatId,'<b>Select your order and text @dvd8ew💭🔊</b>',
        {parse_mode:'HTML',reply_markup: {
            keyboard: [
                [{ text: 'Show products again➰' }]
            ],resize_keyboard: true
        }})
        
    }

});

// Обработка сообщений с неинлайн-кнопками
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if(text==='Show products again➰'){
        if(butt!==undefined){bot.deleteMessage(chatId,butt.message_id)}
        
        
            // Удаляем кнопку "Start Over", если она существует
            if (messagesCache[chatId] && messagesCache[chatId].startOverMessageId) {
                await deleteMessageIfExists(chatId, messagesCache[chatId].startOverMessageId);
            }
        
            // Отправляем начальное сообщение
            const initialMessage = await bot.sendMessage(chatId, "<b>✴️What you can buy here:</b>", { parse_mode: 'HTML' });
            
            // Закрепляем начальное сообщение, если оно еще не закреплено
            await pinMessageIfNotPinned(chatId, initialMessage.message_id, "<b>✴️What you can buy here:</b>");
            
            // Отправляем сообщение о загрузке
            const loadingMessage = await bot.sendMessage(chatId, 'Loading...');
            
            // Удаляем сообщение о загрузке через 2 секунды
            setTimeout(async () => {
                await bot.deleteMessage(chatId, loadingMessage.message_id);
        
                // Отправляем сообщение с анимацией и кнопкой "Next"
                const animationMessage = await bot.sendPhoto(
                    chatId,
                    'https://cdn-icons-png.flaticon.com/256/6553/6553990.png',
                    {
                        caption: '*🔑 Keys from Hamster games 👾*\n\n> All keys for 1 day \\= 0\\.5$\n\n `\\*Can be ordered for a week, \n for 3 days, etc.`',
                        parse_mode: 'MarkdownV2',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Next 1/4', callback_data: 'show_referrals' }]
                            ]
                        }
                    }
                );
        
                // Сохраняем ID сообщения для дальнейшего удаления
                messagesCache[chatId] = {
                    animationMessageId: animationMessage.message_id
                };
            }, 2000);
        
        
        
    }


    if (text === 'Buy🪙+') {
        // Удаляем предыдущие сообщения (альбом)
        if (messagesCache[chatId]) {
            if (messagesCache[chatId].albumMessages) {
                for (const messageId of messagesCache[chatId].albumMessages) {
                    await deleteMessageIfExists(chatId, messageId);
                }
            }
            await deleteMessageIfExists(chatId, messagesCache[chatId].startOverMessageId);

            // Открепляем старое сообщение, если оно существует
            if (pinnedMessages[chatId]) {
                await bot.unpinChatMessage(chatId);
            }
            // Отправляем новое сообщение с текстом и закрепляем его
            const finalMessage = await bot.sendMessage(chatId, '<b>How you can pay?💎</b>',{parse_mode:"HTML"});
            await pinMessageIfNotPinned(chatId, finalMessage.message_id, 'How you can pay?💎');

            // Отправляем сообщение о загрузке
            const loadingMessage = await bot.sendMessage(chatId, 'Loading...');

            // Удаляем сообщение о загрузке через 2 секунды
            setTimeout(async () => {
                await bot.deleteMessage(chatId, loadingMessage.message_id);

                const animationMessage = await bot.sendPhoto(
                    chatId,
                    'https://www.digitalsilk.com/wp-content/uploads/2023/11/online-payment-solutions-hero.jpg',
                    {
                        caption: '*💳 Visa, Mastercard, Paypal and other services*\n\n> Average method\n\n> Sometimes big commissions',
                        parse_mode: 'MarkdownV2',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Next 1/3', callback_data: 'visa' }]
                            ]
                        }
                    }
                );
        
                // Сохраняем ID сообщения для дальнейшего удаления
                messagesCache[chatId] = {
                    animationMessageId: animationMessage.message_id
                };
                
            }, 1500);
        }
    }
});

// Запускаем сервер Express
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
