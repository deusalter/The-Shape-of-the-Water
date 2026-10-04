import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
scenes = []
staging = []

def scene(id, title, text, choices, actors=None, location="theatre", **extra):
    scenes.append(dict(id=id, title=title, paragraphs=text.strip().split("\n\n"), choices=choices, **extra))
    staging.append(dict(sceneId=id, location=location, actors=actors or ["blaise-restored", "julian", "vera-witness", "erasmus"], props=["painted-door", "paper-horse", "account-pages"]))

def choice(id, label, target, **extra):
    return dict(id=id, label=label, target=target, **extra)

scene("a2.testimony", "After the laughter", '''The applause thinned unevenly. Someone near the window kept clapping after the others had stopped, then knocked a cup from a chair in the effort to become quiet. Julian went to pick it up.

Blaise remained in the judge's robe. There were two pages inside it, warm where they had rested against his chest. He knew their creases now. He could find the account of his request by touch.

Erasmus sat in the second row. He had arrived without the long white cloth he wore at his own meals. In his ordinary coat he looked inconveniently like a person who might have come to enjoy a play.

Vera stood beside the painted door. The marks of her demonstration were still on its reverse: an outer star's position, the edge of the city, the little square she had drawn around the instrument box. She had not cleaned them away when the comedy began. A patch of sky on the other side showed through a crack in the wood.

Blaise could make this brief. He had already read his account at the public meal. He could name the requests again, describe what a return did, and leave each listener to supply a motive. A reasonable man might object to repeating the most humiliating part of a confession merely because a different audience had assembled.

But Julian was in this audience. Earlier, Blaise had been able to speak about him as the person outside, the missing man, the man who had an answer. Now he was kneeling beside a stranger's spilled drink. Blaise watched him wipe it up with a cloth intended for the scenery.

He had wanted Julian to be present for the truth. The truth had become less attractive when that wish was granted.

“There is something after the play,” Blaise said.

Julian rose and put the wet cloth down.

“I asked Erasmus to bring the city back,” Blaise said. “Several times. I was allowed to remember what happened between the mornings.”

The robe made a small rustling noise when he took out the pages. He almost apologized for still wearing it. That would have given them something easy to laugh at.''', [
choice("a2.say-whole", "Say that the returns followed Julian's refusals, and describe the request to forget.", "a2.testimony-full", effects=["testimony_full"]),
choice("a2.say-bounded", "Describe the returns and your request to forget; leave the private arguments unnamed.", "a2.testimony-bounded", effects=["testimony_bounded"])
])

scene("a2.testimony-full", "The person in the room", '''“After the bridge fell, a return prevented the accident. Julian asked for that one. There were later requests which I made after he told me he wanted to leave.”

Blaise could hear somebody breathing through an obstructed nose. He disliked them for doing it. There was no spacious, dignified silence in which to become honest.

“I called the conversations mistakes. Sometimes they were. I also made sure that I was the one who remembered them. He had to answer me without knowing how often I had tried the question.”

Julian held the damp cloth between both hands.

“When I found him outside, he told me why he'd gone. I asked for another morning. I gave Vera the place of the witness. I wanted to meet him without my advantage. I also wanted not to know what he had said to me.”

The admission had a strange shape. Blaise could remember writing neither that request nor its explanation. He knew what the paper said; he knew what Vera had seen; he had heard Erasmus acknowledge the request. He stood within the history, trying to speak as though he had never been outside its knowledge.

“I don't remember the feeling with which I asked. That makes it easier to dislike the person who did. It doesn't give Julian back the days.”

“No,” Julian said.

Blaise lowered the pages. He had wanted a longer answer. He was grateful, then ashamed of the gratitude, that Julian did not supply one for the room to enjoy.

“He has not agreed to remain,” Blaise said. “He came here to perform.”

Julian put the cloth on a chair. There was a wet rectangle where it had touched his robe.''', [
choice("a2.full-to-offer", "Put down the account and hear Erasmus.", "a2.offer", actions=[{"type":"disclose","characterId":"julian","refId":"src.public-final-full"},{"type":"disclose","characterId":"erasmus","refId":"src.public-final-full"},{"type":"disclose","characterId":"vera-witness","refId":"src.public-final-full"}])
], sourceIds=["src.public-final-full"])

scene("a2.testimony-bounded", "The account he can bear", '''“I kept the knowledge. People who had lived through those evenings had to meet me without it. I could prepare an answer to something they had not yet said.”

He described the bridge and the repaired bowl. He described the painted door which did not return because it had left the city. When he reached his own most recent request, he held the page farther from him.

“I wanted to meet Julian without that advantage. Vera remembered instead. I have learned what I asked from this account and from the people who were there.”

“Was that all you wanted?” Julian asked.

Blaise looked at him.

“No.”

He could still say the rest. The possibility remained present, like another person's hand held out in a room he was leaving.

“Some of the reasons concerned us,” he said.

“They concerned what you did to what I said.”

A chair creaked. Blaise wished the listener would stop shifting their weight.

“Yes,” he said.

Julian waited for another sentence. When it did not come, he folded the wet cloth into a small square.

Vera did not open the account for him. Blaise felt an unreasonable gratitude toward her, then wondered what she would have done if he had denied the words instead of omitting them.

He laid the pages on the table. Nothing in the paper had changed. The room had heard less than it contained.''', [
choice("a2.bounded-to-offer", "Put down the account and hear Erasmus.", "a2.offer", actions=[{"type":"disclose","characterId":"julian","refId":"src.public-final-bounded"},{"type":"disclose","characterId":"erasmus","refId":"src.public-final-bounded"},{"type":"disclose","characterId":"vera-witness","refId":"src.public-final-bounded"}])
], sourceIds=["src.public-final-bounded"])

scene("a2.offer", "A good day", '''Erasmus took an empty chair onto the stage. He did not ask Blaise to sit.

“They were good days,” he said.

“Some of them.”

“Some of the ones you now wish to be ashamed of.”

“I can be ashamed of what I did without being ashamed of having been happy.”

“Good.” Erasmus settled the chair's short leg on a folded corner of the robe lying beside it. “Then we have not thrown everything away.”

Someone at the rear asked whether the returns had really prevented deaths. Erasmus named no stranger's grief for the room. He said that they had. He described the fallen bridge again, where its weight had struck, the injured people beneath it, and the repairs Blaise made after the restored morning. Julian stood very still while he spoke.

“I know you are tired of gratitude,” Erasmus said to Blaise. “It becomes an unpleasant occupation when it is expected every day. But those people were not illusions supplied to make you grateful.”

“I haven't said they were.”

“You haven't. Other people will find it convenient.”

Vera moved the painted door a little. It had been leaning against her shoulder.

“Are you going to offer it?” she asked.

“Yes.”

Erasmus looked at Julian before looking at Blaise. Blaise disliked this courtesy. A person preparing to do something cruel ought not to notice exactly where courtesy belonged.

“I can give you the dedication morning,” Erasmus said. “You can both have it without this history. I will remember. The bridge can be made safe before anybody steps onto it.”

“And the people who want to leave?” Vera asked.

“They wanted things that morning too.”

“That doesn't answer her,” Julian said.

“It is the beginning of an answer. Why is the man who wanted to remain less entitled to his desire than you are?”

“He isn't less entitled to it. He had it.”

“And it was taken from him by what followed.”

Julian rubbed at a spot on his sleeve.

“If you bring him here instead of me, he won't have answered you. He'll have been brought.”

Erasmus turned to Blaise. “You could lose the burden of arranging it. There would be no privileged listener waiting for the proper reply. You would simply be there with him.”

That was the offer Blaise had been unable to make to himself honestly. No secret superiority. No guilt carefully maintained as evidence of being the more complicated person. He could want Julian and be wanted. His happiness would have its causes, but he would no longer stand behind it counting them.

Across the table, Julian picked up his own pages and put them into the bag he would carry away.''', [
choice("a2.offer-ask-era", "Ask Erasmus what he will lose if you refuse.", "a2.erasmus-loss"),
choice("a2.offer-ask-julian", "Ask Julian whether that earlier happiness was worth having.", "a2.julian-earlier")
])

scene("a2.erasmus-loss", "Someone beside him", '''“What do you lose?” Blaise asked.

“Your good opinion, apparently.”

“You already know I don't think you're God.”

Erasmus lifted a hand, then put it back on his knee.

“I know what you think I haven't proved.”

“Then what do you lose if I refuse?”

The patron looked toward the square. The people who had not found seats were listening through the open window. One of them had begun eating something from a paper bag. Erasmus had fed people there so often that Blaise could imagine him identifying the food by its sound.

“A person who knew what I had done and asked me to do it again,” Erasmus said.

“You have people who want it.”

“I was speaking about you.”

Blaise had prepared an answer about the city. It was difficult to use now.

“When I asked you to speak at the meal,” Erasmus said, “you said no. I took down the cloth. You remember being told about that, I suppose.”

“Yes.”

“I was very angry with you. I thought, for perhaps a minute, that I could have chosen a more grateful person.”

“Why didn't you?”

“I wanted you to be grateful.”

There it was, without the grandeur Blaise had expected. He could have laughed. The impulse hurt enough to stop him.

Erasmus watched his hands.

“And if I refuse?” Blaise asked.

“I shall have to experience your opinion for rather longer.”

“Will you keep the promise?”

“Yes.”

He said it with irritation. Blaise believed it more easily because the irritation had not been made into a lesson.''', [choice("a2.loss-to-decision", "Stand beside the painted door and consider the request.", "a2.decision")], effects=[])

scene("a2.julian-earlier", "The man who was happy", '''“Was it worth having?” Blaise asked.

Julian's hands stopped on the fastening of his bag.

“What?”

“That morning. Before all this. Was it worth having?”

“Yes.”

“Even knowing where it went?”

Julian put the bag down.

“I don't know how to take the knowing out of the question. I loved you. I wanted the room and the horse and the stupid part you played. I still want some of it.”

Blaise waited too eagerly.

“I can't give you a list that will tell you what to do,” Julian said.

“I wasn't asking for one.”

“You were listening as if I might.”

The rebuke was familiar in a way the history on the pages was not. Blaise knew the movement of hope into calculation. He did not need to remember every evening to find it in himself.

“He said the earlier you wanted to remain.”

“I did.”

“Then why should this answer decide?”

Julian looked at the doorway. It was a prop, removed from its hinges, and the opening it had once covered led into a storage cupboard.

“Because I'm answering,” he said. Then, dissatisfied: “That sounds much too neat.”

“It does.”

“I don't mean every desire I have now is better. I mean you can ask me about it. You can argue. He can't come into this room and tell you what he thinks about losing everything that happened after him. You'd have to take it away first.”

Blaise laid a hand on the painted wood. The surface felt warm where the lights had been on it.

“I would like you to come,” Julian said. “Some day. I don't know what we'd be to each other.”

“Would you like it tonight?”

Julian took a long time to answer.

“I want to get the scenery out tonight.”

It was not the answer Blaise had asked for. It was one he could help bring about without knowing whether another would follow.''', [choice("a2.earlier-to-decision", "Let Julian pack and consider Erasmus's offer.", "a2.decision")])

scene("a2.decision", "The request", '''The room had acquired the fatigue which follows a performance. A heel hurt somewhere. Somebody wanted the window closed; somebody else wanted air. The horse's damaged leg sagged against its body, and Julian had stopped pretending that he meant to repair it before carrying it away.

Blaise had thought a decisive moment would simplify the things around it. Instead they continued. He could ask for the morning while a stranger was trying to recover a coat from beneath someone else's chair.

Erasmus would not need to make the recovered happiness false. That was its terrible attraction. The person who had loved Blaise would love him. He would have his own desires, his own jokes, the familiar little impatience with bad work. There would be no empty imitation for a wiser spectator to expose.

What would be missing was the man now putting a wet cloth into his bag because the company could not afford to lose another one.

Blaise had learned to dislike the phrase the latest self. It made Julian sound like an edition to be compared with earlier printings. The past mattered. The morning mattered. But none of it could answer the man presently making room for the cloth.

He could not establish that refusing would be an uncaused act. A thousand conditions had brought him here, among them his wish to be admired for refusing. If he waited for a motive untouched by the world, he would have to wait until there was nobody left who could want to act.

Nor could he turn the truth of this history into a promise that its continuation would be kind. Julian might not come back. Erasmus might keep his word and remain disagreeable. Blaise might perform badly tomorrow and discover that no profound change in his understanding prevented embarrassment.

He wanted the letter Julian had not yet written. He wanted the next rehearsal. He wanted the morning before he had known he could lose either. Desire did not sort itself into a single clean direction.

Erasmus rose from the chair.

“Blaise,” he said. “What are you asking me for?”''', [
choice("a2.refuse-return", "Refuse this return. Let the present evening continue.", "a2.forward", effects=["ending_forward"], irreversible=True),
choice("a2.request-return", "Ask for the dedication morning and surrender the intervening memories.", "a3.good-morning", effects=["ending_return"], irreversible=True)
])

forward = '''“Let this evening continue,” Blaise said.

Erasmus waited. He seemed to expect a qualification that would improve the answer.

“You are not asking me to return it?”

“No.”

The patron touched the back of the chair. His hand rested there until the person whose robe supported its short leg came to retrieve it.

“You will have to help me move this,” Erasmus said.

Blaise lifted the chair. It was an awkward, ordinary weight. They set it against the wall, and Erasmus returned the robe without looking at its owner.

People began to leave. Some went to the road; some went home. A woman asked Erasmus when she could speak to him about a return of her own. He told her that they could talk tomorrow. Blaise heard the resentment in her answer. The city's wishes had not become unanimous merely because he had spoken.

Vera took her diagram from the door and found that one corner had stuck in the wet paint. She pulled too quickly and tore the cloth.

“Oh, damn it.”

Julian offered to help. She refused, then let him hold the door while she peeled off the rest.

When the company came for the scenery, Blaise took the horse's head. The others maneuvered its absurd length into the square. This time he could not know which leg would fail. He kept a hand beneath the nearest joint.

At the cart, Julian stopped beside him.

“I need some time,” Julian said. “I want you to let that mean time, without deciding in advance what I'll have done with it.”

Blaise nodded. He had more to say than that, but none of it needed to be said before the cart could move.

Julian climbed up beside the horse. He did not make their departure look like a rejection staged for the square. He checked the fastening, asked somebody to shift a box and waved to Vera. Then he looked back at Blaise.

“I'll write,” he said.

The cart went down the west road. Blaise remained until the part of the street he could see no longer contained it. Then he went back inside. There were cups to move before the room could be used again, and Erasmus had begun stacking them in a way that would certainly end badly.'''
invited = forward.replace('“I need some time,” Julian said. “I want you to let that mean time, without deciding in advance what I\'ll have done with it.”', '“We need somebody to play the judge,” Julian said. “I want it to be you. I also want a little time before you come.”\n\n“Both?”\n\n“Yes. I\'m afraid both.”')
scene("a2.forward", "Time", forward, [choice("a2.stay-for-morning", "Return to the theatre for its first unplanned morning.", "a2.new-morning")], variants=[{"id":"invitation","requires":["testimony_full","let_vera_finish","greenroom_hear"],"paragraphs":invited.strip().split("\n\n")}])

scene("a2.new-morning", "Something after", '''Erasmus brought breakfast in a dish which was too large for the table. He had expected more people.

“They have gone to look at the sky,” he said.

“Is it different?”

“It is always different. They have decided to notice.”

Blaise took a piece of bread. It was burnt on one side.

Erasmus watched him turn it over.

“I can do that again.”

“Make toast?”

“Yes, Blaise. Make toast.”

They laughed. Erasmus took the burnt piece back and ate it himself with a quantity of jam Blaise found alarming.

The comedy had lost its horse, its principal maker and the actor who played the woman disguised as a bishop. Blaise proposed performing the judge alone until they found something better. Erasmus said that the judge had been the least plausible part.

“You laughed.”

“At you falling over.”

“Then I shall have to develop it.”

They moved the table to make space. After a while Vera arrived, carrying the torn diagram and complaining that several people were treating the stars' continued existence as a personal favor she had arranged for them.

“Perhaps you should stop asking them to thank you,” Erasmus said.

She considered throwing something at him. Blaise saw the consideration in the movement of her hand toward the bread. She took a piece instead.

There were six people in the audience when they began. A seventh came in with a letter, put it on the table beside Blaise's pages and sat down. Julian's handwriting was on the folded outside.

Blaise missed his entrance.

Erasmus made a small coughing noise which was meant to be helpful and was not.

Blaise looked at the letter. Nothing required him to leave it closed. It might contain something he had been afraid to hope for. It might undo the small confidence with which he had put on the robe.

He went around the table.

“Your Honours,” he said, addressing the empty place where the horse ought to have stood, “I regret to inform you that the office has lost its occupant.”

“Which office?” Vera asked from the audience.

He had not prepared for that. He looked at the chair, the robe, the window above the street.

“Whichever of you was about to offer it to me,” he said.

It was not a particularly good line. Somebody laughed anyway. Blaise wanted to continue.''', [choice("a2.open-letter", "Finish the scene, then open Julian's letter.", "a2.letter", ending=True)], actors=["blaise-restored","erasmus","vera-witness"])

letter = '''The letter began with a complaint about the horse. One of its legs had come off before they reached the rain.

Julian described where they had put the painted door and how the first rehearsal had gone. He had left a space, then begun again. He wanted a little longer before they met. He did not know how to make that sound less like punishment and had decided to write it plainly.

At the bottom was a correction to the judge's last speech. Blaise read it twice. He could see how to make the pause work.

Erasmus asked whether he wanted more bread.

“In a minute,” Blaise said.

He fetched a clean page. There was something about the judge he wanted to tell Julian, and something about the burnt toast, and an answer to the request which would be harder to write. He sat at the table and began.'''
letter_invited = letter.replace('He wanted a little longer before they met. He did not know how to make that sound less like punishment and had decided to write it plainly.', 'The company could offer him a place for a visit after the next performance. Julian wanted him to come. He had added that he was making no promises about the room Blaise would sleep in. The sentence was crossed out, then written again below the crossing.')
scene("a2.letter", "A reply", letter, [], actors=["blaise-restored","erasmus","vera-witness"], variants=[{"id":"invitation","requires":["testimony_full","let_vera_finish","greenroom_hear"],"paragraphs":letter_invited.strip().split("\n\n")}])

scene("a3.good-morning", "The good morning", '''“I want the morning,” Blaise said.

Julian put down his bag.

Erasmus looked at him, then at Vera. He did not ask either of them a question.

“And the memory?” he asked Blaise.

Blaise had thought this part would be easy. He had already done it once. But the man who had made that request had left a page for somebody to find. Here there would be only Erasmus.

“Keep it,” he said. “You keep it.”

Julian took a step toward the door. The room brightened before he reached it.

For an instant Blaise saw the wet cloth in the open bag, the uneven fold Julian had given it, and wanted absurdly to preserve that single thing. It had no special virtue. It was merely there, arranged by a hand which would not arrange it in quite that way again.

Then the light became the morning's light.

Blaise stood beside the horse. A length of string lay over his wrist. Julian was inside it, attempting to back out of a wardrobe which had ceased to contain him comfortably.

“I measured it,” Julian said.

“The wardrobe?”

“The head.”

Blaise waited.

“I forgot about the horse's other end.”

The laughter surprised him. He had been worried about the performance, about the robe, about the possibility of failing to give Julian the afternoon he wanted. For the moment he found nothing to calculate. Julian came out of the horse, took the scissors from beside Blaise's hand and kissed him.

Through the window, high above the square, somebody began beating a rug. Dust lifted into the light.''', [choice("a3.carry-horse", "Help Julian carry the horse through the door.", "a3.final-horse", ending=True)], actors=["blaise-final","julian-restored"])

scene("a3.final-horse", "The other end", '''The leg fell off when they tried to turn it.

Julian swore. Blaise laughed so hard that he had to set the head down. Neither of them was hurt.

“We could leave it here,” Blaise said.

“The horse?”

“We could let the audience come to it.”

Julian considered this with the seriousness of a man to whom several bad ideas had recently been useful.

“Help me put it back,” he said.

They lifted together.

On the other side of the square, Erasmus stood under the dining-room awning. He listened to the laughter until somebody came to ask him what it meant.''', [], actors=["blaise-final","julian-restored"])

sources = [
dict(id="src.public-final-full",title="The public account, including its private purpose",text="Blaise said before Julian, Vera and Erasmus that he requested returns after Julian wanted to leave, retained privileged knowledge of their conversations, and later requested his own forgetting partly to escape Julian's refusal. He distinguished learned facts from feelings he can no longer remember.",kind="statement",provenanceId="blaise-final-public-account",speakerId="blaise-restored"),
dict(id="src.public-final-bounded",title="The public account, with motives left unnamed",text="Blaise described requesting returns, keeping privileged knowledge, and later giving Vera the witness's place. When Julian asked whether losing that advantage was his only purpose, Blaise said no but did not describe the private arguments. He acknowledged that those reasons concerned what he did to Julian's answers.",kind="statement",provenanceId="blaise-final-public-account",speakerId="blaise-restored")
]
for s in scenes:
    s.pop("effects", None)
for stage in staging:
    if stage["sceneId"].startswith("a3."):
        stage["props"] = ["painted-door", "paper-horse"]
        stage["offscreenActors"] = ["erasmus"]
(HERE / "ending.json").write_text(json.dumps(dict(scenes=scenes,sources=sources,staging=staging,notes={"status":"complete first pass for integration and criticism","privacy":"Only explicit public statements are sources. Inner reflections are never disclosed automatically.","endingGuards":"Invitation texture requires testimony_full, let_vera_finish and greenroom_hear; neither philosophical assent nor factual proof score substitutes for these acts."}),ensure_ascii=False,indent=2)+"\n")
