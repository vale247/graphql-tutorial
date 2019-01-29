var express = require('express');
var graphqlHTTP = require('express-graphql');
var graphql = require('graphql');
var axios = require('axios');

axios.interceptors.request.use(
	function(config) {
		console.log('call to ', config.url);
		return config;
	},
	function(error) {
		// Do something with request error
		return Promise.reject(error);
	}
);

var worldType = new graphql.GraphQLObjectType({
	name: 'World',
	fields: () => ({
		name: { type: graphql.GraphQLString },
		rotation_period: { type: graphql.GraphQLString },
		diameter: { type: graphql.GraphQLString },
		terrain: { type: graphql.GraphQLString }
	})
});

var filmType = new graphql.GraphQLObjectType({
	name: 'Film',
	fields: () => ({
		title: { type: graphql.GraphQLString },
		episode_id: { type: graphql.GraphQLString },
		release_date: { type: graphql.GraphQLString },
		characters: {
			type: new graphql.GraphQLList(personType),
			resolve: function(parent) {
				return Promise.all(
					parent.characters.map((value) => {
						return axios.get(value).then((res) => res.data);
					})
				);
			}
		}
	})
});

var personType = new graphql.GraphQLObjectType({
	name: 'Person',
	fields: () => ({
		name: { type: graphql.GraphQLString },
		height: { type: graphql.GraphQLString },
		mass: { type: graphql.GraphQLString },
		eye_color: { type: graphql.GraphQLString },
		homeworld: {
			type: worldType,
			resolve: function(parent) {
				return axios.get(parent.homeworld).then((res) => res.data);
			}
		},
		films: {
			type: new graphql.GraphQLList(filmType),
			resolve: function(parent) {
				return Promise.all(
					parent.films.map((value) => {
						return axios.get(value).then((res) => res.data);
					})
				);
			}
		}
	})
});

// Define the Query type
var queryType = new graphql.GraphQLObjectType({
	name: 'Query',
	fields: {
		person: {
			type: personType,
			// `args` describes the arguments that the `user` query accepts
			args: {
				id: { type: graphql.GraphQLID }
			},
			resolve: function(_, { id }) {
				return axios.get(`https://swapi.co/api/people/${id}`).then((res) => res.data);
			}
		},
		people: {
			type: new graphql.GraphQLList(personType),
			resolve: function() {
				return axios.get(`https://swapi.co/api/people/`).then((res) => res.data.results);
			}
		}
	}
});

var schema = new graphql.GraphQLSchema({ query: queryType });

var app = express();
app.use(
	'/graphql',
	graphqlHTTP({
		schema: schema,
		graphiql: true
	})
);
app.listen(5000);
console.log('Running a GraphQL API server at localhost:5000/graphql');
