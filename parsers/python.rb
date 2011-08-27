require 'yaml'

sketchText = <<SKETCH
MrPraline: 'Ello, I wish to register a complaint.
(Owner: does not respond.)
MrPraline: 'Ello, Miss?
Owner: What do you mean "miss"?
MrPraline: I'm sorry, I have a cold. I wish to make a complaint!
Owner: We're closin' for lunch.
MrPraline: Never mind that, my lad. I wish to complain about this parrot what I purchased not half an hour ago from this very boutique.
Owner: Oh yes, the, uh, the Norwegian Blue...What's,uh...What's wrong with it?
MrPraline: I'll tell you what's wrong with it, my lad. 'E's dead, that's what's wrong with it!
Owner: No, no, 'e's uh,...he's resting.
MrPraline: Look, matey, I know a dead parrot when I see one, and I'm looking at one right now.
Owner: No no he's not dead, he's, he's restin'! Remarkable bird, the Norwegian Blue, idn'it, ay? Beautiful plumage!
MrPraline: The plumage don't enter into it. It's stone dead.
Owner: Nononono, no, no! 'E's resting!
MrPraline: All right then, if he's restin', I'll wake him up! (shouting at the cage) 'Ello, Mister Polly Parrot! I've got a lovely fresh cuttle fish for you if you show...
(Owner: hits the cage)
Owner: There, he moved!
MrPraline: No, he didn't, that was you hitting the cage!
Owner: I never!!
MrPraline: Yes, you did!
Owner: I never, never did anything...
MrPraline: (yelling and hitting the cage repeatedly) 'ELLO POLLY!!!!! Testing! Testing! Testing! Testing! This is your nine o'clock alarm call!
(MrPraline: Takes parrot out of the cage and thumps its head on the counter. Throws it up in the air and watches it plummet to the floor.)
MrPraline: Now that's what I call a dead parrot.
Owner: No, no.....No, 'e's stunned!
MrPraline: STUNNED?!?
Owner: Yeah! You stunned him, just as he was wakin' up! Norwegian Blues stun easily, major.
MrPraline: Um...now look...now look, mate, I've definitely 'ad enough of this. That parrot is definitely deceased, and when I purchased it not 'alf an hour ago, you assured me that its total lack of movement was due to it bein' tired and shagged out following a prolonged squawk.
Owner: Well, he's...he's, ah...probably pining for the fjords.
MrPraline: PININ' for the FJORDS?!?!?!? What kind of talk is that?, look, why did he fall flat on his back the moment I got 'im home?
Owner: The Norwegian Blue prefers keepin' on it's back! Remarkable bird, id'nit, squire? Lovely plumage!
MrPraline: Look, I took the liberty of examining that parrot when I got it home, and I discovered the only reason that it had been sitting on its perch in the first place was that it had been NAILED there.
(pause)
Owner: Well, o'course it was nailed there! If I hadn't nailed that bird down, it would have nuzzled up to those bars, bent 'em apart with its beak, and VOOM! Feeweeweewee!
MrPraline: "VOOM"?!? Mate, this bird wouldn't "voom" if you put four million volts through it! 'E's bleedin' demised!
Owner: No no! 'E's pining!
MrPraline: 'E's not pinin'! 'E's passed on! This parrot is no more! He has ceased to be! 'E's expired and gone to meet 'is maker! 'E's a stiff! Bereft of life, 'e rests in peace! If you hadn't nailed 'im to the perch 'e'd be pushing up the daisies! 'Is metabolic processes are now 'istory! 'E's off the twig! 'E's kicked the bucket, 'e's shuffled off 'is mortal coil, run down the curtain and joined the bleedin' choir invisibile!! THIS IS AN EX-PARROT!!
(pause)
Owner: Well, I'd better replace it, then. (he takes a quick peek behind the counter) Sorry squire, I've had a look 'round the back of the shop, and uh, we're right out of parrots.
MrPraline: I see. I see, I get the picture.
Owner: I got a slug.
(pause)
MrPraline: Pray, does it talk?
Owner: Nnnnot really.
MrPraline: WELL IT'S HARDLY A BLOODY REPLACEMENT, IS IT?!!???!!?
Owner: N-no, I guess not.
(Owner: gets ashamed, looks at his feet)
MrPraline: Well.
(pause)
Owner: (quietly) D'you.... d'you want to come back to my place?
(MrPraline: looks around)
MrPraline: Yeah, all right, sure.
SKETCH


class String
  def deep_stringify_keys; self end
end

class Hash
  def deep_stringify_keys
    new_hash = {}
    self.each do |key, value|
      new_hash[key.to_s] = \
      if value.is_a?(Hash)
        value.deep_stringify_keys
      elsif value.is_a?(Array)
        value.map { |i| i.deep_stringify_keys }
      else
        value
      end
    end 
    new_hash
  end
end

actors = [
  { :id => 'MrPraline', :name => 'Mr. Praline' },
  { :id => 'Owner', :name => 'Shop Owner'}
]

irc = {
  :channel => '#petshop',
  :prefix => 'mpdp|',
  :server => 'irc.freenode.org'
}

who_colon_what = /^([a-zA-Z.]+): (.+)$/

skript = [{ :action => 'enter', :actors => ['Owner', 'MrPraline']}]
sketchText.lines.each do |line|
  case line
  when /^\((.+)\)$/
    if line == '(pause)' then
      # puts '(pause)'
      skript << { :action => 'pause' }
    else
      $+.scan who_colon_what do |actor, what|
        # puts "#{actor} performs #{what}"
        skript << { :action => 'perform', :actor => actor, :what => what }
      end
    end
  when who_colon_what
    line.scan who_colon_what do |actor, line|
      # puts "#{actor} says #{line}"
      skript << { :action => 'speak', :actor => actor, :line => line }
    end
  else
    puts "malformatted line: #{line}"
  end
end

result = {
  :author => 'Monthy Python',
  :title => 'The Dead Parot',
  :setup => {
    :actors => actors,
    :irc => irc
  },
  :skript => skript
}

File.open('skripts/dead_parrot.yml', "w") do |f|
  f.write result.deep_stringify_keys.to_yaml 
end