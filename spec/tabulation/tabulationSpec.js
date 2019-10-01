var _ = require('lodash');
var Tabulation = require('../../public/javascripts/tabulation')();

describe("Tabulation", function() {

    it("Should have left/right strings", function() {
        expect(Tabulation.LEFT).toEqual("left");
        expect(Tabulation.RIGHT).toEqual("right");
    });

    describe("Next scores", function() {
        function testScoreCounts(originalMaxCount, expectedValues) {
            var currentMaxCount = originalMaxCount;

            for(var valueIndex=0, valuesLength=expectedValues; valueIndex<valuesLength; valuesIndex++) {
                var expectedCount = expectedValues[valueIndex];
                currentMaxCount = Tabulation.generateNextCount(originalMaxCount, currentMaxCount);
                expect(currentMaxCount).toEqual(expectedCount);
            }
        }

        it("Should correctly count MAX 4", function() {
            testScoreCounts(4, [3,5,2,6,1,7,8,9]);
        });

        it("Should correctly count MAX 3", function() {
            testScoreCounts(3, [2,4,1,5,6,7,8,9]);
        });

        it("Should correctly count MAX 2", function() {
            testScoreCounts(2, [1,3,4,5,6,7,8,9]);
        });
    });

    describe("Rider Ranking", function() {
        function sortOverallResults(overallResults) {
            return _.orderBy(overallResults, ['total'], ['desc']);
        }

        function testExpectedRanks(overallResults, expectedRanks, tiedRiderIds) {
            overallResults = sortOverallResults(overallResults);
            var riderRanks = Tabulation.getRiderRanks(overallResults);

            // Check the overall ranks
            _.forEach(expectedRanks, function(expectedRank) {
                expect(riderRanks.riderIdToRank[expectedRank.id]).toEqual(expectedRank.rank);
            });

            // Check the tied riders
            expect(riderRanks.tiedRiders.length).toEqual(tiedRiderIds.length);

            _.forEach(tiedRiderIds, function(tiedRiderIdsSet, index) {
                var calculatedTiedRiders = riderRanks.tiedRiders[index];

                expect(calculatedTiedRiders.length).toEqual(tiedRiderIdsSet.length);

                _.forEach(tiedRiderIdsSet, function(tiedRiderId) {
                    var foundHeatRider = _.find(calculatedTiedRiders, function(heatRider) {
                        return heatRider.rider._id == tiedRiderId
                    });
                    expect(foundHeatRider).toBeDefined();
                });
            });
        }

        it("Should handle simple ranking", function() {
            var overallResults = [
                { heatRider: { rider: { _id: "id1" }}, total: 10 },
                { heatRider: { rider: { _id: "id2" }}, total: 9 }
            ];

            var expectedRanks = [
                { id: 'id1', rank: 1},
                { id: 'id2', rank: 2}
            ];

            testExpectedRanks(overallResults, expectedRanks, []);
        });

        it("Should handle ties start", function() {
            var overallResults = [
                { heatRider: { rider: { _id: "id1" }}, total: 10 },
                { heatRider: { rider: { _id: "id2" }}, total: 10 },
                { heatRider: { rider: { _id: "id3" }}, total: 9 },
                { heatRider: { rider: { _id: "id4" }}, total: 8 }
            ];

            var expectedRanks = [
                { id: 'id1', rank: 1},
                { id: 'id2', rank: 1},
                { id: 'id3', rank: 3},
                { id: 'id4', rank: 4}
            ];

            var expectedTies = [
                ['id1', 'id2']
            ];

            testExpectedRanks(overallResults, expectedRanks, expectedTies);
        });

        it("Should handle ties inside", function() {
            var overallResults = [
                { heatRider: { rider: { _id: "id1" }}, total: 10 },
                { heatRider: { rider: { _id: "id2" }}, total: 9 },
                { heatRider: { rider: { _id: "id3" }}, total: 9 },
                { heatRider: { rider: { _id: "id4" }}, total: 8 }
            ];

            var expectedRanks = [
                { id: 'id1', rank: 1},
                { id: 'id2', rank: 2},
                { id: 'id3', rank: 2},
                { id: 'id4', rank: 4}
            ];

            var expectedTies = [
                ['id2', 'id3']
            ];

            testExpectedRanks(overallResults, expectedRanks, expectedTies);
        });

        it("Should handle ties end", function() {
            var overallResults = [
                { heatRider: { rider: { _id: "id1" }}, total: 10 },
                { heatRider: { rider: { _id: "id2" }}, total: 9 },
                { heatRider: { rider: { _id: "id3" }}, total: 8 },
                { heatRider: { rider: { _id: "id4" }}, total: 8 }
            ];

            var expectedRanks = [
                { id: 'id1', rank: 1},
                { id: 'id2', rank: 2},
                { id: 'id3', rank: 3},
                { id: 'id4', rank: 3}
            ];

            var expectedTies = [
                ['id3', 'id4']
            ];

            testExpectedRanks(overallResults, expectedRanks, expectedTies);
        });

        it("Should handle multiple ties", function() {
            var overallResults = [
                { heatRider: { rider: { _id: "id1" }}, total: 10 },
                { heatRider: { rider: { _id: "id2" }}, total: 10 },
                { heatRider: { rider: { _id: "id3" }}, total: 8 },
                { heatRider: { rider: { _id: "id4" }}, total: 8 }
            ];

            var expectedRanks = [
                { id: 'id1', rank: 1},
                { id: 'id2', rank: 1},
                { id: 'id3', rank: 3},
                { id: 'id4', rank: 3}
            ];

            var expectedTies = [
                ['id1','id2'],
                ['id3', 'id4']
            ];

            testExpectedRanks(overallResults, expectedRanks, expectedTies);
        });

        it("Should handle long ties", function() {
            var overallResults = [
                { heatRider: { rider: { _id: "id1" }}, total: 10 },
                { heatRider: { rider: { _id: "id2" }}, total: 8 },
                { heatRider: { rider: { _id: "id3" }}, total: 8 },
                { heatRider: { rider: { _id: "id4" }}, total: 8 }
            ];

            var expectedRanks = [
                { id: 'id1', rank: 1},
                { id: 'id2', rank: 2},
                { id: 'id3', rank: 2},
                { id: 'id4', rank: 2}
            ];

            var expectedTies = [
                ['id2', 'id3', 'id4']
            ];

            testExpectedRanks(overallResults, expectedRanks, expectedTies);
        });
    });
});
