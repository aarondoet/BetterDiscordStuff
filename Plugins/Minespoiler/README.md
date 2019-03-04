# Minespoiler
Send games of minesweeper

## Usage
### Sending minesweeper games
#### Just minesweeper
If you just want to send the game of minesweeper you can send a message with the content
`minesweeper:<width> <height> <bombCount>`<br>
**Example:** `minesweeper:17 8 20`

#### Inside a message
If you want to include the game into a message you can send a message with the content
```
minesweeper:<width> <height> <bombCount> here some text
%GAME%
here some other text that is below the game
```
There is no linebreak in front of or behind the game so you should add it by yourself

### Playing minesweeper
There are some tweeks for playing minesweeper, but they are only possible for people who have this plugin.<br>
* With this plugin you can actually right click a field to mark it as a bomb.
* When you click a field that is a :zero: it will automatically reveal all fields next to it
* When you finished revealing all fields without a bomb all bombs will get flagged
* When you click a bomb all fields get revealed
* There is an information about how many bombs are left
* If you win or fail there is a retry button

## Preview
![Minespoiler preview](https://l0c4lh057.github.io/BetterDiscord/Plugins/Minespoiler/minespoiler-preview.gif)
