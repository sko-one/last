# Sanya Ko Operations — sko.one

Статичен сайт: един `index.html` и папка `images/`. Без WordPress, без база данни, без build стъпка.

## Структура

```
index.html          целият сайт: дизайн, код и съдържание
images/
  about/            портретът в About
  icons/            иконките на социалните мрежи
  <проект>/         thumb.jpg (квадрат за мрежата), cover.jpg (корица), 01.jpg, 02.jpg… (лентата)
.nojekyll           казва на GitHub Pages да не обработва файловете
```

## Публикуване в GitHub Pages

1. Създай ново хранилище (repository) в GitHub, например `sko-site`.
2. Качи всички файлове от тази папка в него (Add file → Upload files, или с `git push`).
3. Settings → Pages → Source: **Deploy from a branch**, Branch: **main**, папка **/ (root)** → Save.
4. След минута-две сайтът е на `https://<потребител>.github.io/sko-site/`.

### Собствен домейн sko.one

1. Settings → Pages → Custom domain: `sko.one` → Save (GitHub създава файл `CNAME`).
2. При регистратора на домейна насочи DNS записите към GitHub Pages:
   - четири `A` записа за `sko.one`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` запис за `www` → `<потребител>.github.io`
3. Когато DNS-ът се обнови, включи **Enforce HTTPS**.

Внимание: щом DNS записите се сменят, сегашният WordPress сайт на sko.one спира да се показва.

## Редактиране на съдържанието

Цялото съдържание е в обекта `SITE` в началото на скрипта в `index.html`:
текстове на двата езика (`{ en: "…", bg: "…" }`), проекти, контакти, социални мрежи.

Нова снимка към проект: сложи файла в `images/<проект>/` и добави пътя му в `gallery`, например `"images/mn50/07.jpg"`.
Нов проект: копирай блок от `projects` и смени `slug`, `title`, `categories`, снимките и текста.

Може и просто да качиш `index.html` в разговор с Claude, да опишеш промяната и да върнеш обновения файл в GitHub.
