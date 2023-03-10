const csv = require("csvtojson");
const rootDir = require("./root");
const path = require("path");
const fs = require("fs");
const router = require("express").Router();
const dbPath = path.join(rootDir, "pokemons.json");
const { faker } = require("@faker-js/faker");

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flying",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

const init = async () => {
  const csvFilePath = path.join(rootDir, "pokemon.csv");
  let pokemonsData = await csv().fromFile(csvFilePath);

  const pokemonImgFiles = path.join(rootDir, "public", "pokemon_images");
  const pokemonImages = fs
    .readdirSync(pokemonImgFiles)
    .map((image) => image.split(".")[0]);

  pokemonsData = pokemonsData.map((pokemon, index) => {
    if (pokemonImages.includes((index + 1).toString())) {
      return {
        id: index + 1,
        name: pokemon.Name,
        types: pokemon.Type2
          ? [pokemon.Type1.toLowerCase(), pokemon.Type2.toLowerCase()]
          : [pokemon.Type1.toLowerCase()],
        url: `https://raw.githubusercontent.com/lephuthuc2001/pokemon_be/main/public/pokemon_images/${
          index + 1
        }.jpg`,
        description: faker.lorem.paragraph(3),
        height: faker.address.zipCode("###") + "cm",
        weight: faker.address.zipCode("###") + "kg",
        category: faker.word.adjective(),
        abilities: faker.music.songName(),
      };
    }
  });

  pokemonsData = pokemonsData.filter((pokemon) => !!pokemon);

  fs.writeFileSync(
    dbPath,
    JSON.stringify({
      data: pokemonsData,
      totalPokemons: pokemonsData.length,
    })
  );

  return fs.readFileSync(dbPath, {
    encoding: "utf8",
  });
};

const getDataFromDb = () => {
  const dbPath = path.join(rootDir, "pokemons.json");

  return fs.readFileSync(dbPath, {
    encoding: "utf8",
  });
};

router.get("/:pokemonId", async function (req, res, next) {
  let pokemonsData = getDataFromDb();

  if (!pokemonsData) {
    pokemonsData = await init();
  }

  pokemonsData = JSON.parse(pokemonsData);

  //// get pokemon by ID

  const pokemonId = parseInt(req.params.pokemonId);

  const previousPokemonId =
    pokemonId === 1 ? pokemonsData.data.length : pokemonId - 1;

  const nextPokemonId =
    pokemonId === pokemonsData.data.length ? 1 : pokemonId + 1;

  const result = {
    pokemon: pokemonsData.data.find((pokemon) => pokemon.id === pokemonId),
    nextPokemon: pokemonsData.data.find(
      (pokemon) => pokemon.id === nextPokemonId
    ),
    previousPokemon: pokemonsData.data.find(
      (pokemon) => pokemon.id === previousPokemonId
    ),
  };
  return res.send({ data: result });
});

router.post("/", function (req, res, next) {
  let data = getDataFromDb();

  data = JSON.parse(data);

  const { name, id, url, types } = req.body;

  ////"Missing required data
  if (!name || !id || !url || !types) {
    return res.status(401).send({ message: "Missing required value" });
  }
  ///Pok??mon can only have one or two types
  if (types[0]) {
    if (!pokemonTypes.includes(types[0])) {
      return res.status(401).send({ message: "Pok??mon's type is invalid" });
    }
  }

  if (types[1]) {
    if (!pokemonTypes.includes(types[1])) {
      return res.status(401).send({ message: "Pok??mon's type is invalid" });
    }
  }

  if (
    data.data.find(
      (pokemon) => pokemon.name.toLowerCase() === name.toLowerCase()
    ) ||
    data.data.find((pokemon) => parseInt(pokemon.id) === parseInt(id))
  ) {
    return res.status(401).send({ message: "Pok??mon is existing" });
  }

  data.data.push({
    id: parseInt(id),
    name: name.toLowerCase(),
    types: types.filter((type) => type !== null),
    url,
    description: faker.lorem.paragraph(3),
    height: faker.address.zipCode("###") + "cm",
    weight: faker.address.zipCode("###") + "kg",
    category: faker.word.adjective(),
    abilities: faker.music.songName(),
  });

  fs.writeFileSync(
    dbPath,
    JSON.stringify({
      data: data.data,
      totalPokemons: data.data.length,
    })
  );
  return res.status(200).send({ message: "Add successfully" });
});

router.get("/", async function (req, res, next) {
  let pokemonsData = getDataFromDb();

  if (!pokemonsData) {
    pokemonsData = await init();
  }
  pokemonsData = JSON.parse(pokemonsData);

  ///Search with query
  let result = pokemonsData.data;

  const { page, limit, search, type } = req.query;

  /// type
  if (type) {
    result = result.filter((pokemon) => pokemon.types.includes(type) === true);
  }
  ///search
  if (search) {
    result = result.filter(
      (pokemon) => pokemon.name.toLowerCase() === search.toLowerCase()
    );
  }
  //page
  result = result.slice(limit * (page - 1), limit * page);

  return res.send({
    data: result,
  });
});

router.delete("/:pokemonId", function (req, res, next) {
  let data = getDataFromDb();

  data = JSON.parse(data);

  const pokemonId = parseInt(req.params.pokemonId);

  const pokemon = data.data.find(
    (pokemon) => parseInt(pokemon.id) === parseInt(pokemonId)
  );

  if (!pokemon) {
    return res.status(404).send({
      message: "No such pokemon",
    });
  }
  let result = data.data.filter(
    (pokemon) => parseInt(pokemon.id) !== parseInt(pokemonId)
  );

  fs.writeFileSync(
    dbPath,
    JSON.stringify({
      data: result,
      totalPokemons: result.length,
    })
  );
  return res.status(200).send({ message: "Delete successfully" });
});

router.put("/", function (req, res, next) {
  let data = getDataFromDb();

  data = JSON.parse(data);

  const {
    name,
    id,
    url,
    types,
    description,
    height,
    weight,
    abilities,
    category,
  } = req.body;

  if (
    !data.data.find(
      (pokemon) => pokemon.name.toLowerCase() === name.toLowerCase()
    ) &&
    !data.data.find((pokemon) => parseInt(pokemon.id) === parseInt(id))
  ) {
    return res.status(401).send({ message: "Pok??mon is not existing" });
  }
  ////"Missing required data
  if (!name || !id || !url || !types) {
    return res.status(401).send({ message: "Missing required value" });
  }
  ///Pok??mon can only have one or two types
  if (types[0]) {
    if (!pokemonTypes.includes(types[0])) {
      return res.status(401).send({ message: "Pok??mon's type is invalid" });
    }
  }

  if (types[1]) {
    if (!pokemonTypes.includes(types[1])) {
      return res.status(401).send({ message: "Pok??mon's type is invalid" });
    }
  }

  const pokemon = data.data.find(
    (pokemon) => parseInt(pokemon.id) === parseInt(id)
  );

  const updateIndex = data.data.indexOf(pokemon);

  data.data[updateIndex] = {
    name,
    id,
    url,
    types,
    description,
    height,
    weight,
    abilities,
    category,
  };

  fs.writeFileSync(
    dbPath,
    JSON.stringify({
      data: data.data,
      totalPokemons: data.data.length,
    })
  );
  return res.status(200).send({ message: "Update successfully" });
});
module.exports = router;
