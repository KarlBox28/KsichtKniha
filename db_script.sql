--
-- Struktura tabulky `comments`
--

CREATE TABLE `comments` (
                            `comment_id` int(11) NOT NULL,
                            `user_id` int(11) NOT NULL,
                            `post_id` int(11) NOT NULL,
                            `body` text NOT NULL,
                            `commented_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;

--
-- Struktura tabulky `likes`
--

CREATE TABLE `likes` (
                         `user_id` int(11) NOT NULL,
                         `post_id` int(11) NOT NULL,
                         `liked_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;

--
-- Struktura tabulky `posts`
--

CREATE TABLE `posts` (
                         `post_id` int(11) NOT NULL,
                         `title` varchar(255) NOT NULL,
                         `body` text NOT NULL,
                         `user_id` int(11) NOT NULL,
                         `image` varchar(255) DEFAULT NULL,
                         `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;

--
-- Struktura tabulky `users`
--

CREATE TABLE `users` (
                         `user_id` int(11) NOT NULL,
                         `username` varchar(255) NOT NULL,
                         `password_hash` varbinary(255) NOT NULL,
                         `password_salt` varbinary(255) NOT NULL,
                         `first_name` varchar(255) DEFAULT NULL,
                         `last_name` varchar(255) DEFAULT NULL,
                         `age` int(11) NOT NULL,
                         `sex` varchar(1) DEFAULT NULL,
                         `role` varchar(255) NOT NULL DEFAULT 'user',
                         `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                         `profile_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;

--
-- Indexy pro tabulku `comments`
--
ALTER TABLE `comments`
    ADD PRIMARY KEY (`comment_id`),
    ADD KEY `comments_index_5` (`post_id`),
    ADD KEY `comments_index_6` (`commented_at`),
    ADD KEY `user_id` (`user_id`);

--
-- Indexy pro tabulku `likes`
--
ALTER TABLE `likes`
    ADD PRIMARY KEY (`user_id`,`post_id`),
    ADD KEY `likes_index_4` (`post_id`);

--
-- Indexy pro tabulku `posts`
--
ALTER TABLE `posts`
    ADD PRIMARY KEY (`post_id`),
    ADD KEY `posts_index_1` (`user_id`),
    ADD KEY `posts_index_2` (`created_at`),
    ADD KEY `posts_index_3` (`user_id`,`created_at`);

--
-- Indexy pro tabulku `users`
--
ALTER TABLE `users`
    ADD PRIMARY KEY (`user_id`),
    ADD UNIQUE KEY `username` (`username`),
    ADD UNIQUE KEY `users_index_0` (`username`);

--
-- AUTO_INCREMENT pro tabulku `comments`
--
ALTER TABLE `comments`
    MODIFY `comment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pro tabulku `posts`
--
ALTER TABLE `posts`
    MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pro tabulku `users`
--
ALTER TABLE `users`
    MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Omezení pro exportované tabulky
--

--
-- Omezení pro tabulku `comments`
--
ALTER TABLE `comments`
    ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
    ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`);

--
-- Omezení pro tabulku `likes`
--
ALTER TABLE `likes`
    ADD CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
    ADD CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`);

--
-- Omezení pro tabulku `posts`
--
ALTER TABLE `posts`
    ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
COMMIT;
