-- ==============================================================================
-- SEED DATA: 50 Romantic & Thoughtful Questions of the Day
-- ==============================================================================

INSERT INTO public.daily_questions (day_index, category, question_text) VALUES
(1, 'romance', 'What is your absolute favorite memory of us together so far?'),
(2, 'dates', 'If we could book a flight right this second to anywhere in the world, where are we going?'),
(3, 'feelings', 'What is one little thing I do without realizing that always makes you smile?'),
(4, 'dates', 'Describe what our dream lazy Sunday date looks like from morning to night.'),
(5, 'romance', 'When was the exact moment you realized you had feelings for me?'),
(6, 'fun', 'If we opened a little bakery or cafe together, what would we name it and what would be our signature item?'),
(7, 'feelings', 'What is one song that immediately reminds you of us every time you hear it?'),
(8, 'romance', 'What is your favorite picture of us and why does that memory mean so much to you?'),
(9, 'future', 'What is something new you want us to try or learn together this upcoming year?'),
(10, 'gratitude', 'What is a small gesture of love that always warms your heart when you are having a tough day?'),
(11, 'fun', 'What movie or TV show couple do we remind you of the most?'),
(12, 'romance', 'What did you honestly think of me on our very first date?'),
(13, 'feelings', 'What makes our relationship feel different and special compared to anything else?'),
(14, 'dates', 'If you could plan a secret surprise date for me with zero budget limit, what would we do?'),
(15, 'fun', 'What is our funniest inside joke or most hilarious shared disaster?'),
(16, 'gratitude', 'What is one way I have supported or helped you that meant the world to you?'),
(17, 'future', 'Where do you see us 5 years from today?'),
(18, 'romance', 'What is your favorite physical touch between us (holding hands, forehead kiss, long hug)?'),
(19, 'feelings', 'What is something you find completely irresistible about me?'),
(20, 'dates', 'Would you rather have a cozy rainy night in with candles and takeout, or an adventurous night out in the city?'),
(21, 'fun', 'If we could adopt any pet right now, what animal would it be and what would we name it?'),
(22, 'romance', 'What was the sweetest text message or note I ever sent you?'),
(23, 'future', 'What is a tradition you want us to create and keep for years to come?'),
(24, 'gratitude', 'What part of your personality do you feel has flourished the most since we have been together?'),
(25, 'fun', 'If you could swap one habit of ours for a week, what would it be?'),
(26, 'romance', 'What was running through your mind right before our first kiss?'),
(27, 'feelings', 'How do you describe me to your friends or family when I am not around?'),
(28, 'dates', 'What is your favorite meal that we have ever shared together?'),
(29, 'future', 'What does our dream cozy home look like?'),
(30, 'romance', 'What is one promise you make to me for our future together?')
ON CONFLICT (day_index) DO UPDATE SET 
    question_text = EXCLUDED.question_text,
    category = EXCLUDED.category;
