# scrum-dealer
Simple Discord bot to play scrum poker on.

### Commands:

#### !sprint <@role>
Primes the bot to start working. This command also sets you as the 'owner' of the plan, meaning only you can ask it to shut down without providing an extra `-f` argument.

#### !add <@User>
Adds a single user to the plan, allowing them to place bets.

#### !remove <@User>
Counterpart of the above.

#### !list
Shows all users that are in the plan.

#### !bet
Start recording bets from users with the next command. This also makes so the bot activelly deletes messages that are sent in the room.

#### /spoiler \<number\>
Registers a bet on your name. The first time you do this, the bot will say that you did so. If you do it again before the round is over, your bet gets updated but nothing is shown.

#### !clear
Removes your bet from the pool.

#### !deal -s
Tries to rounds up the round and show the betting average, if any. If any members have not yet voted, this will fail with a verbose warning of which votes are missing. The `-s` argument allows it to `skip` this verification. Also stops erasing messages from the room.

#### !finish -f
Allows the bot to shut down. The `-f` argument shuts it down forcibly, ignoring ownership.
