
# Deno Release
* Update deno.json
* git tag v0.0.5
* git push --tag

# Node Release
* Update package.json
* Local testing: npm install ../../../node_port from test/integration/node_test/
* npm run build
* (npm adduser)
* npm publish --access public
* ...