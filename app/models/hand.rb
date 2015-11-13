class Hand
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :player
  embeds_many :gamecards, :class_name => "GameCard"
  field :bet, type: Integer
  field :fold, type: Boolean
  field :current, type: Boolean
  field :action_count, type: Integer

  belongs_to :round

  def self.new_hand(player, card1, card2, bet)
    return self.create(player: player, gamecards: [GameCard.new_card(card1[0], card1[1]), GameCard.new_card(card2[0], card2[1])], bet: bet, action_count: 0)
  end

  def place_bet(bet)
    if(self.player.chips >= bet)
      self.bet = bet
    else
      self.bet = self.player.chips
    end
  end

  def get_card(card_index) #index can be 1 or 2
    return gamecards[card_index-1]
  end
end