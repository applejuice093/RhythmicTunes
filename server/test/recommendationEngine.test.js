const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const {
  attachSongsToPlayCounts,
  getUniqueValues,
} = require("../utils/recommendationEngine");

test("getUniqueValues drops empty values and de-duplicates in first-seen order", () => {
  assert.deepEqual(
    getUniqueValues(["Pop", " Pop ", null, undefined, "", "  ", "Jazz", "Pop"]),
    ["Pop", "Jazz"]
  );
});

test("getUniqueValues stringifies ObjectIds so equal ids collapse", () => {
  const id = new mongoose.Types.ObjectId();
  const sameId = new mongoose.Types.ObjectId(id.toString());

  assert.deepEqual(getUniqueValues([id, sameId]), [id.toString()]);
});

test("getUniqueValues returns an empty array for no input", () => {
  assert.deepEqual(getUniqueValues([]), []);
});

test("attachSongsToPlayCounts keeps ranking order and play counts", () => {
  const a = new mongoose.Types.ObjectId();
  const b = new mongoose.Types.ObjectId();
  const songs = [
    { _id: a, title: "A" },
    { _id: b, title: "B" },
  ];

  const result = attachSongsToPlayCounts(
    [
      { _id: b, playCount: 9 },
      { _id: a, playCount: 4 },
    ],
    songs
  );

  assert.deepEqual(
    result.map(({ playCount, song }) => [song.title, playCount]),
    [
      ["B", 9],
      ["A", 4],
    ]
  );
});

test("attachSongsToPlayCounts skips deleted songs and null ids", () => {
  const kept = new mongoose.Types.ObjectId();
  const deleted = new mongoose.Types.ObjectId();

  const result = attachSongsToPlayCounts(
    [
      { _id: deleted, playCount: 10 },
      { _id: null, playCount: 7 },
      { _id: kept, playCount: 3 },
    ],
    [{ _id: kept, title: "Kept" }]
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].song.title, "Kept");
  assert.equal(result[0].playCount, 3);
});
