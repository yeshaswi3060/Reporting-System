Create these files in this folder and fill with 16 compass keys (N..NNW):

bedroom.json
main_entrance.json
main_entrance_2.json
main_entrance_3.json
kitchen.json
entertainment_room.json
study_room.json
guest_room.json
toilet.json
drawing_room.json
dinning_hall.json
ac.json
staircase.json
underground_watertank.json
septik_tank.json
inverter.json
heater.json
washing_area.json
bar.json

Each JSON should look like:
{
  "N": { "zone": "Best", "element": "water", "remedies_primary": ["..."], "remedies_secondary": ["..."], "effect": ["..."] },
  "NNE": { "zone": "Good", "element": "water", "remedies_primary": [], "remedies_secondary": [], "effect": [] },
  ... 16 total keys ...
}

You can copy placeholder.json to start.

