from pathlib import Path
from authoring import Module, choice, paragraphs, HERE

m=Module("opening")
for id,name in [("blaise","Blaise Bloom"),("blaise-restored","Blaise Bloom"),("blaise-final","Blaise Bloom"),("julian","Julian Quince"),("julian-restored","Julian Quince"),("vera","Vera Harlowe"),("vera-witness","Vera Harlowe"),("erasmus","Erasmus Rochester")]:
    m.characters.append(dict(id=id,name=name,initial=dict(knows=[],believes=[],claims=[])))

m.scene("a0.tribute","Late for his miracle",'''Blaise was late for his own miracle.

The guests had already taken the good chairs. Through the palace windows he could see the theatre across the square, its long window propped open with a piece of scenery. Something enormous and white moved inside. Julian had said he would only need help for an hour. That had been an hour ago.

Erasmus came toward Blaise carrying two cups and a plate balanced on one forearm. He managed this well. It was one of the things that made his power difficult to place. A man who could restore the city still took a visible satisfaction in bringing three things across a crowded room without a tray.

“You've come without the robe,” he said.

“Julian needs it.”

“You will be able to speak without it, I hope.”

Blaise took a cup. The liquid had tiny lights in it. Above the highest terrace the night had left several stars close enough to reach, and Erasmus's kitchen had been experimenting.

“They don't dissolve,” the patron said. “You can leave it in the bottom.”

The commemorative cloth hung behind the table. Blaise recognized the bridge in its embroidery, the fall of white stone, the small human shape somebody had made for him beneath it. On the other side stood an uninjured figure under an ascending sun. Whoever had sewn it had given the restored man larger hands.

“I wasn't so graceful,” Blaise said.

“You needn't describe the injury. Tell them why you think you were brought back.”

“Because Julian asked.”

“And why his request was answered.”

The guests had noticed him. A child was being moved from a chair so that Blaise could sit at the center. He could no longer pretend that this was merely a meal at which an old subject might arise.

He owed Erasmus his life. He could say that without qualification. What troubled him was the movement from owing his life to knowing what the life was for. The patron's attention had made the transition seem natural. Blaise had survived; somebody wanted him to survive; perhaps therefore he had been necessary to a purpose he could not yet see.

He wanted that conclusion. It would have been pleasant to stand before a room of people and discover that gratitude had made him important.

Across the square, Julian's white object struck the inside of the theatre window. Blaise heard a very distant swear.

“I told them you would explain,” Erasmus said.''',[
choice("a0.decline-purpose","Say that you can thank Erasmus but cannot claim to know why you were chosen.","a0.refusal-plain",effects=["tribute_plain"]),
choice("a0.decline-performance","Tell Erasmus you will not turn the injury into this performance.","a0.refusal-sharp",effects=["tribute_sharp"])
],actors=["blaise","erasmus"],location="palace",props=["commemorative-cloth","star-cups","long-table"])

m.scene("a0.refusal-plain","The part he cannot say",'''“I can tell them what you did,” Blaise said. “I can't tell them what it proves about the reason I exist.”

Erasmus held the plate between them. Blaise took a piece of bread because it seemed rude to leave him holding it.

“You believe there was a reason.”

“I want there to have been.”

“You say that as though wanting were an objection.”

“It isn't an answer either.”

The patron looked toward the guests. The child was still being persuaded to surrender the chair. Erasmus set the plate down and told the parent to leave the child where she was.''',[
choice("a0.plain-promise","Remain while Erasmus tells the guests.","a0.promise")
],actors=["blaise","erasmus"],location="palace",props=["commemorative-cloth","long-table"])

m.scene("a0.refusal-sharp","A different audience",'''“I don't want them to watch me remember being crushed,” Blaise said.

“That isn't what I asked.”

“It is what you put on the cloth.”

Erasmus looked back at it. The embroidered figure lay patiently beneath the falling stone.

“You might have said so before they arrived.”

“You might have asked before inviting them.”

Blaise wished at once that he had found a way to say it which would not sound so satisfactory when repeated. Some of the guests had heard. He could feel their attention becoming the thing he had objected to.

Erasmus set down the plate and went to the center of the room.''',[
choice("a0.sharp-promise","Remain while Erasmus tells the guests.","a0.promise")
],actors=["blaise","erasmus"],location="palace",props=["commemorative-cloth","long-table"])

m.scene("a0.promise","The cloth comes down",'''“There will be no address,” Erasmus said. “Please eat.”

One of the guests began to object on Blaise's behalf. Erasmus interrupted before the objection had acquired a purpose. He asked a different guest about her journey, then went to take down the cloth.

It caught on one of its hooks. Blaise moved to help.

“I can manage this.”

The patron tugged too hard. A loop tore, and the restored figure folded over the injured one. Erasmus held the fabric while he worked the remaining loop free.

For a moment Blaise could almost see how the scene might have gone better. He could have arrived earlier, thanked him privately, refused with more tenderness. Gratitude might have survived without that torn sound. He caught himself considering an arrangement of events which would let him say no without making another person experience refusal.

Erasmus carried the cloth into the passage. Blaise followed him as far as the door.

“Will you be angry all day?” he asked.

“I don't yet know.”

“You could know.”

The patron stopped folding.

“I promised you something when you came back. While you remain in Aubade I will not return the city without your request. I have not revoked it.”

“Even for this?”

“Especially if the purpose were to have a more agreeable conversation.”

Blaise heard a reproach in it. Erasmus did not say whose earlier requests he had in mind.

“Go and help Julian,” the patron said. “He has been making a distressing amount of noise.”

Outside, the street rose away from the square, turning gradually until its upper houses hung over the lower ones. Somebody leaned out high above Blaise to shake a rug. Dust climbed past them both toward the dark curve of the sky.''',[
choice("a0.go-theatre","Cross the square to help Julian.","a0.horse",actions=[{"type":"disclose","characterId":"blaise","refId":"src.patron-promise"},{"type":"disclose","characterId":"erasmus","refId":"src.patron-promise"}])
],actors=["blaise","erasmus"],location="palace",props=["folded-cloth"],sourceIds=["src.patron-promise"])

sample=(HERE.parent/"replacement-proposal-2026-10-04/SAMPLE-SCENE.md").read_text()
body=sample[sample.index("Blaise caught the horse's leg before it fell."):].strip()
anchors=["Blaise caught the horse's leg before it fell.","Julian leaned against him to reach the scissors.","Julian had stopped laughing.","He fetched the pages and gave Blaise the top one."]
indexes=[body.index(a) for a in anchors]+[len(body)]
segments=[body[indexes[i]:indexes[i+1]].strip() for i in range(4)]
segments[3]=segments[3].replace('“You told me there hadn\'t been another return while we were writing this.”','“You told me there hadn\'t been another return while we were writing this,” Julian said.')
for id,title,text,nextid,label in [
("a0.horse","The horse's other end",segments[0],"a0.judge","Stay beside Julian as they mend the horse."),
("a0.judge","A useful animal",segments[1],"a0.invitation","Attend to the letter Julian is looking at."),
("a0.invitation","A place elsewhere",segments[2],"a0.weeds","Read the unfinished final speech."),
("a0.weeds","The word on the back",segments[3],"a0.after-door","Remain in the theatre after Julian leaves.")]:
    m.scene(id,title,text,[choice(id+"-onward",label,nextid)],actors=["blaise","julian"],location="theatre",props=["paper-horse","judge-robe","painted-door","play-pages"]) 

m.scene("a0.after-door","An opening in the scenery",'''The cupboard behind the removed door was full of things Julian had not found a use for. A broken umbrella. A strip of red cloth. The first attempt at the horse's head, which was small enough to suggest that some entirely different animal had once been considered.

Blaise sat on the table. He wanted Julian to come back and ask the question again in a way that made the answer possible.

He could have followed him. Vera kept her instruments near the western edge. Julian had said where he was going. There was nothing mysterious about the route, nothing which required a favor before Blaise could take it.

Instead he picked up the page.

Weeds.

He could remember the pleasure with which they had reached that word. It was not a story Erasmus had told him. Julian had been lying on his stomach with a pencil under his hand, and Blaise had watched him make the small alteration. Afterward they had done nothing important. The evening remained valuable without having produced a declaration or an explanation.

He had brought the word into this afternoon as though carrying something safely out of a fire. Julian had experienced it as a hand inside a drawer.

Blaise put the page down. He remained beside it until the light had moved across the table. When he finally went to the window, the cart was coming down the narrow street from Vera's part of the edge. The painted door lay flat across it. Julian was walking beside the horse, making room for something that had once filled their room together.

The cart crossed the corner of the square and continued to the west road.

Blaise went to the palace.''',[
choice("a0.tell-departure","Tell Erasmus plainly that Julian appears to be leaving.","a0.palace-night",effects=["departure_plain"]),
choice("a0.call-ruin","Tell Erasmus that the afternoon has been ruined.","a0.palace-night",effects=["departure_evasion"])
],actors=["blaise"],location="theatre",props=["play-pages","empty-doorway"],sourceIds=["src.departing-cart"])

night='''Erasmus was eating in the kitchen. The public plates stood in three stacks beside the sink. Without the guests the palace sounded much larger.

“Julian is going,” Blaise said.

Erasmus set down his spoon.

“Did he tell you?”

“He said he thought he would. I saw him take the cart west.”

“Then he may be.”

Blaise had expected the patron to correct the tense. He might have said that Julian would come back, that the departure belonged to an afternoon which need not determine anything. Instead he moved a second bowl toward him.

The soup was too hot. Blaise ate it anyway. He wanted to finish something.

“I said a line,” he told Erasmus. “One we wrote together. He hadn't written it here yet.”

“Ah.”

“He thinks I took something from him.”

“Did you?”

“I remembered it.”

“That is not always the whole answer.”

Blaise set down the spoon.

“You could have told me that earlier.”

“I believe I have told you many things earlier.”

The patron reached for bread, and Blaise saw him discover that there was none left. He looked disappointed in a plain, bodily way. It made Blaise angry that he should still be able to want bread.

“You remember everything,” Blaise said. “You know what he wanted before this.”

“I remember more of it than you do.”

“Then you know this isn't all he is.”

“Of course it isn't.”

That assent was dangerously pleasant. Blaise found himself able to sit more comfortably. Julian's present refusal could be one incomplete expression of a life whose complete meaning was held elsewhere. A finite answer, corrected by a more comprehensive love.

He did not want to stand up.'''
night_evasion=night.replace('“Julian is going,” Blaise said.', '“The afternoon has been ruined,” Blaise said.').replace('“Did he tell you?”','“What happened?”').replace('“He said he thought he would. I saw him take the cart west.”','“Julian thinks he will leave. I saw him take the cart west.”')
m.scene("a0.palace-night","The person who remembers",night,[choice("a0.ask-for-gift","Ask what the restored morning could give them.","a0.gift",actions=[{"type":"disclose","characterId":"blaise","refId":"src.departing-cart"},{"type":"disclose","characterId":"erasmus","refId":"src.departing-cart"}])],actors=["blaise","erasmus"],location="palace",props=["soup-bowls","stacked-plates"],variants=[dict(id="evasion",requires=["departure_evasion"],paragraphs=paragraphs(night_evasion))])

m.scene("a0.gift","What a favor can do",'''“You could be together,” Erasmus said. “You would not be obliged to make the same mistakes.”

“Would he want me?”

“He did.”

“That isn't what I asked.”

The patron wiped the rim of his bowl with a piece of cloth.

“What would satisfy you? A word which had no relation to anything he had ever known? A gesture from a man who had no reason to distinguish you from the chair?”

“You know what I mean.”

“Yes. I do.”

His voice had become less patient. Blaise was relieved. Perfect patience would have made it impossible to believe he was being heard.

“I want it to be him,” Blaise said. “When he answers. I don't want to put the words in him.”

“You can meet him. You can let him answer.”

“And if I remember the answer?”

“You remember many things about him. Would you prefer to be a stranger?”

Blaise did not. He wanted all the intimacy of a history without the power by which knowing it might alter what followed. The demand moved away whenever he approached it. If Julian were made indifferent to all their shared life, Blaise would be the first to call that a mutilation.

The bridge had not been an argument. It had fallen. He remembered the little patch of white sky between Julian's fingers, the weight of a body becoming impossible to inhabit, the certainty that there would be no opportunity to become more understanding. Julian had asked. Erasmus had answered. Afterward they had sat on the repaired stone eating bread, and for a while existing had been enough.

He could not make that goodness disappear merely because the gift had since become useful to a less admirable wish.

“I can give you the morning,” Erasmus said. “I cannot promise that you will never have a reason to ask again.”

Blaise looked toward the kitchen window. The low darkness was beginning to touch the highest streets. A woman on an upper terrace lifted a sheet clear of it and brought her washing inside.

He could still go west. He could still follow the cart.

He moved his chair closer to Erasmus.''',[
choice("a0.ask-first-return","Ask Erasmus to restore the dedication morning, keeping your memory as witness.","a0.first-return",irreversible=True)
],actors=["blaise","erasmus"],location="palace",props=["soup-bowls","kitchen-window"])

m.scene("a0.first-return","The bowl",'''“Give me the morning,” Blaise said.

Erasmus reached for his hand. It was not a necessary gesture; he had told Blaise that before. He liked someone to be beside him.

The low darkness lifted from the upper houses. It did not move like cloud. For an instant Blaise could see the streets through it, each window occupying two positions, the familiar room and the room from which it had descended. The plate stacks made a sound like a row of teeth closing.

A bowl near Blaise's elbow had a crack across its lip. The two edges approached one another until the dark line was a hair, then an uncertainty in the glaze, then nothing. He touched the place. It was cool.

People in the square began sentences which their mouths had once begun. Somewhere a child complained about a ribbon. The voice arrived with such familiar force that Blaise almost answered it.

Then there was simply morning.

Erasmus sat beside him. The soup had gone. A pot of uncooked beans stood on the far counter.

Blaise was hungry in a different way. His body had been returned to the day's beginning, while the previous evening remained accessible with an intimacy no surviving object in the kitchen appeared to share.

“You should go to him,” Erasmus said.

The advice sounded generous. Blaise got up before he could ask whether he would have thought so yesterday.

Across the square, the theatre window stood open. There was no movement behind it.''',[
choice("a0.cross-after-return","Cross the square and look for Julian.","a1.empty-theatre",actions=[{"type":"disclose","characterId":"blaise","refId":"src.first-return"},{"type":"disclose","characterId":"erasmus","refId":"src.first-return"}])
],actors=["blaise","erasmus"],location="palace",props=["whole-bowl","bean-pot"],sourceIds=["src.first-return"])

m.source("src.patron-promise","Before the first witnessed return: Erasmus's promise","Erasmus canceled the public address when Blaise refused it, took down the cloth, and told him that while Blaise remains in Aubade he will not restore the city without Blaise's request.",kind="statement",provenance="erasmus-promise",speakerId="erasmus")
m.source("src.departing-cart","Before the first witnessed return: the westbound cart","After remaining in the theatre for a while, Blaise saw Julian walking with the cart and the painted door, coming from the direction of Vera's part of the edge. The cart crossed the square and continued onto the west road.",provenance="blaise-cart-sighting")
m.source("src.first-return","The first witnessed return: the restored bowl","After Blaise asked for the dedication morning, he and Erasmus remained together while the cracked bowl became whole, the soup disappeared and the city resumed its morning conditions. Blaise retained his memory of the preceding evening.",provenance="first-return-observation")
m.write(source="Opening sample paragraphs are retained verbatim from the reviewed bec72856 sample; new surrounding scenes are authored for this complete production.",actors="The first return changes Vera to vera-witness when she is encountered again. Julian was outside and remains julian. Blaise retains memory until the second return.")
