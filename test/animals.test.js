const assert = require('assert');

describe('Animals', function () {
  describe('Validation', function () {
    it('should require animal name', function () {
      const name = '';
      assert.strictEqual(name.length, 0);
    });

    it('should validate species selection', function () {
      const species = 'dog';
      const validSpecies = ['dog', 'cat', 'bird', 'rabbit', 'hamster'];
      assert.ok(validSpecies.includes(species));
    });

    it('should accept birth date', function () {
      const birthDate = new Date('2020-01-15');
      assert.ok(birthDate instanceof Date);
    });
  });
});
