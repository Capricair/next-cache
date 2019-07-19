const TimeUnit = {
    Second: 1000,
    Minute: 60 * 1000,
    Hour: 60 * 60 * 1000,
    Day: 24 * 60 * 60 * 1000,
};

const isCacheExpired = function(result){
    return new Date() - result.timestamp > result.duration * TimeUnit.Second;
};

module.exports = {
    TimeUnit,
    isCacheExpired,
};