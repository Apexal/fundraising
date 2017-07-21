$(function () {
    const rankSelect = $('#rank');
    const rankLabel = $('label[for="superior"]');
    const directorsSelect = $('#directors');
    const ambassadorsSelect = $('#ambassadors');

    rankSelect.on('change', function () {
        if (this.value == 'teacher') {
            rankLabel.text('Program Director');
            directorsSelect.show();
            ambassadorsSelect.hide();
        } else {
            rankLabel.text('Ambassador');
            directorsSelect.hide();
            ambassadorsSelect.show();
        }
    });
});