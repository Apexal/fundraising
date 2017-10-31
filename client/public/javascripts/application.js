$(function () {
    const rankSelect = $('#rank');
    const rankLabel = $('label[for="superior"]');
    const directorsSelect = $('#directors');
    const ambassadorsSelect = $('#ambassadors');

    rankSelect.on('change', function () {
        if (this.value == 'teacher') {
            rankLabel.show();
            rankLabel.text('Program Director');
            directorsSelect.show();
            ambassadorsSelect.hide();
        } else if (this.value == 'director') {
            rankLabel.show();
            rankLabel.text('Ambassador');
            directorsSelect.hide();
            ambassadorsSelect.show();
        }
    });
});